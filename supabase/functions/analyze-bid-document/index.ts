import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleCheck } = await supabase.rpc('is_admin_or_staff', { _user_id: user.id });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Missing documentId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to analyzing
    await supabase.from('bid_documents').update({ status: 'analyzing' }).eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('bid-documents')
      .download(doc.file_path);

    if (downloadError || !fileData) {
      await supabase.from('bid_documents').update({ status: 'error' }).eq('id', documentId);
      return new Response(JSON.stringify({ error: 'Failed to download file' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Convert file to base64 for vision model
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = doc.file_type || 'application/pdf';

    const extractionPrompt = `You are analyzing a bid document for a sports court construction company (CourtPro Augusta). Extract the following key details from this document. If a field is not found, set it to null.

Return a JSON object with these fields:
{
  "bid_deadline": "date/time string or null",
  "project_name": "string or null",
  "project_location": "string or null",
  "owner_agency": "string or null - who is issuing the bid",
  "scope_of_work": "brief summary string or null",
  "court_details": "any court specifications, dimensions, sport types, surface types mentioned or null",
  "bond_requirements": {
    "bid_bond": "string description or null",
    "performance_bond": "string description or null",
    "payment_bond": "string description or null"
  },
  "insurance_requirements": "string summary or null",
  "prevailing_wage": "boolean or null - whether prevailing wage/Davis-Bacon applies",
  "material_specs": "any specific material requirements (surface systems, brands, standards) or null",
  "budget_range": "any budget or cost estimate mentioned or null",
  "submission_requirements": "how/where to submit the bid or null",
  "pre_bid_meeting": "date/location of pre-bid meeting or null",
  "key_contacts": "contact persons mentioned or null",
  "certifications_required": "any required certifications (DBE, MBE, etc.) or null",
  "liquidated_damages": "any liquidated damages clause or null",
  "timeline": "project timeline or completion requirements or null",
  "important_notes": ["array of other important items to note"]
}`;

    // Use vision model to read the document
    const messages: any[] = [
      { role: 'system', content: extractionPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: 'Please analyze this bid document and extract the key details as specified. Return ONLY the JSON object, no markdown formatting.',
          },
        ],
      },
    ];

    console.log(`Analyzing bid document: ${doc.file_name} (${doc.file_size} bytes)`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      await supabase.from('bid_documents').update({ status: 'error' }).eq('id', documentId);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';

    // Parse the JSON from the response
    let extractedData;
    try {
      // Remove any markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      extractedData = { raw_response: content, parse_error: true };
    }

    // Now get a text summary for chat context using a second call
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
              },
              {
                type: 'text',
                text: 'Please transcribe all the text content from this document. Include all details, numbers, dates, and requirements. This will be used as context for follow-up questions.',
              },
            ],
          },
        ],
        max_tokens: 16000,
        temperature: 0,
      }),
    });

    let documentText = '';
    if (textResponse.ok) {
      const textResult = await textResponse.json();
      documentText = textResult.choices?.[0]?.message?.content || '';
    }

    // Update document with extracted data
    await supabase.from('bid_documents').update({
      extracted_data: extractedData,
      document_text: documentText,
      status: 'analyzed',
      updated_at: new Date().toISOString(),
    }).eq('id', documentId);

    return new Response(JSON.stringify({ success: true, extracted_data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analyze bid document error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
