export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          account_id: string
          amount: number
          bank_description: string | null
          counterparty_id: string | null
          counterparty_name: string | null
          created_at: string
          description: string | null
          id: string
          matched_invoice_id: string | null
          matched_payment_id: string | null
          mercury_id: string
          posted_at: string | null
          status: string
          transaction_type: string | null
        }
        Insert: {
          account_id: string
          amount: number
          bank_description?: string | null
          counterparty_id?: string | null
          counterparty_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          matched_invoice_id?: string | null
          matched_payment_id?: string | null
          mercury_id: string
          posted_at?: string | null
          status: string
          transaction_type?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          bank_description?: string | null
          counterparty_id?: string | null
          counterparty_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          matched_invoice_id?: string | null
          matched_payment_id?: string | null
          mercury_id?: string
          posted_at?: string | null
          status?: string
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_payment_id_fkey"
            columns: ["matched_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_document_messages: {
        Row: {
          bid_document_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          bid_document_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          bid_document_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_document_messages_bid_document_id_fkey"
            columns: ["bid_document_id"]
            isOneToOne: false
            referencedRelation: "bid_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_documents: {
        Row: {
          created_at: string
          document_text: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_text?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_text?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          email: string | null
          id: string
          mercury_customer_id: string | null
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          mercury_customer_id?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          mercury_customer_id?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_type: string
          error_message: string | null
          failed_at: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          related_id: string | null
          resend_email_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          related_id?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          related_id?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      estimate_attachments: {
        Row: {
          annotations: Json | null
          caption: string | null
          created_at: string
          estimate_id: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          annotations?: Json | null
          caption?: string | null
          created_at?: string
          estimate_id?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          annotations?: Json | null
          caption?: string | null
          created_at?: string
          estimate_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_attachments_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_custom_items: {
        Row: {
          created_at: string
          customer_price: number
          description: string
          estimate_id: string | null
          id: string
          markup_percent: number | null
          notes: string | null
          pricing_mode: string
          sort_order: number | null
          updated_at: string
          vendor_cost: number | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string
          customer_price: number
          description: string
          estimate_id?: string | null
          id?: string
          markup_percent?: number | null
          notes?: string | null
          pricing_mode?: string
          sort_order?: number | null
          updated_at?: string
          vendor_cost?: number | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string
          customer_price?: number
          description?: string
          estimate_id?: string | null
          id?: string
          markup_percent?: number | null
          notes?: string | null
          pricing_mode?: string
          sort_order?: number | null
          updated_at?: string
          vendor_cost?: number | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_custom_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          quantity: number
          sort_order: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          id?: string
          quantity?: number
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          quantity?: number
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_scope_bullets: {
        Row: {
          bullet_text: string
          created_at: string | null
          estimate_id: string
          id: string
          sort_order: number | null
        }
        Insert: {
          bullet_text: string
          created_at?: string | null
          estimate_id: string
          id?: string
          sort_order?: number | null
        }
        Update: {
          bullet_text?: string
          created_at?: string | null
          estimate_id?: string
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_scope_bullets_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          display_format: string | null
          estimate_number: string
          id: string
          lead_id: string | null
          notes: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          display_format?: string | null
          estimate_number: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          display_format?: string | null
          estimate_number?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          estimate_id: string | null
          id: string
          invoice_number: string
          mercury_invoice_id: string | null
          notes: string | null
          paid_at: string | null
          payment_link_created_at: string | null
          payment_link_token: string | null
          pdf_url: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number: string
          mercury_invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_link_created_at?: string | null
          payment_link_token?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          invoice_number?: string
          mercury_invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_link_created_at?: string | null
          payment_link_token?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          converted_customer_id: string | null
          created_at: string
          email: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          phone: string | null
          project_type: string | null
          source: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          converted_customer_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          source?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          converted_customer_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          source?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_headquarters: boolean | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_headquarters?: boolean | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_headquarters?: boolean | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      material_inventory: {
        Row: {
          color_name: string | null
          container_size: number
          container_type: string
          cost_per_container: number
          cost_per_gallon: number
          created_at: string | null
          id: string
          is_active: boolean | null
          is_premium_color: boolean | null
          is_primary: boolean | null
          last_price_update: string | null
          notes: string | null
          product_code: string
          product_line: string
          product_name: string
          product_type: string
          quantity_on_hand: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          color_name?: string | null
          container_size: number
          container_type: string
          cost_per_container: number
          cost_per_gallon: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_premium_color?: boolean | null
          is_primary?: boolean | null
          last_price_update?: string | null
          notes?: string | null
          product_code: string
          product_line?: string
          product_name: string
          product_type: string
          quantity_on_hand?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          color_name?: string | null
          container_size?: number
          container_type?: string
          cost_per_container?: number
          cost_per_gallon?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_premium_color?: boolean | null
          is_primary?: boolean | null
          last_price_update?: string | null
          notes?: string | null
          product_code?: string
          product_line?: string
          product_name?: string
          product_type?: string
          quantity_on_hand?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          convenience_fee_amount: number | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          invoice_id: string | null
          mercury_transaction_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_type: string
          receipt_sent_at: string | null
          reference_number: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          convenience_fee_amount?: number | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          mercury_transaction_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          receipt_sent_at?: string | null
          reference_number?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          convenience_fee_amount?: number | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          mercury_transaction_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          receipt_sent_at?: string | null
          reference_number?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          label: string
          product_line: string
          sort_order: number | null
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          label: string
          product_line?: string
          sort_order?: number | null
          unit?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          label?: string
          product_line?: string
          sort_order?: number | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_materials: {
        Row: {
          allocated_at: string | null
          consumed_at: string | null
          container_size: number | null
          containers_allocated: number | null
          created_at: string | null
          gallons_required: number
          id: string
          inventory_item_id: string | null
          notes: string | null
          product_name: string
          product_type: string
          project_id: string
          status: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          allocated_at?: string | null
          consumed_at?: string | null
          container_size?: number | null
          containers_allocated?: number | null
          created_at?: string | null
          gallons_required: number
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          product_name: string
          product_type: string
          project_id: string
          status?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          allocated_at?: string | null
          consumed_at?: string | null
          container_size?: number | null
          containers_allocated?: number | null
          created_at?: string | null
          gallons_required?: number
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          product_name?: string
          product_type?: string
          project_id?: string
          status?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "material_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_by: string | null
          completed_date: string | null
          created_at: string
          id: string
          milestone_name: string
          milestone_type: string
          notes: string | null
          project_id: string
          scheduled_date: string | null
          sort_order: number
          status: string
        }
        Insert: {
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          id?: string
          milestone_name: string
          milestone_type: string
          notes?: string | null
          project_id: string
          scheduled_date?: string | null
          sort_order?: number
          status?: string
        }
        Update: {
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          id?: string
          milestone_name?: string
          milestone_type?: string
          notes?: string | null
          project_id?: string
          scheduled_date?: string | null
          sort_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          milestone_id: string | null
          photo_type: string | null
          photo_url: string
          project_id: string
          taken_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          milestone_id?: string | null
          photo_type?: string | null
          photo_url: string
          project_id: string
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          milestone_id?: string | null
          photo_type?: string | null
          photo_url?: string
          project_id?: string
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          assigned_to: string | null
          contract_value: number | null
          created_at: string
          customer_id: string | null
          estimate_id: string | null
          id: string
          is_usta_funded: boolean | null
          location_id: string | null
          notes: string | null
          project_name: string
          project_number: string | null
          scheduled_start_date: string | null
          site_address: string | null
          site_city: string | null
          site_lat: number | null
          site_lng: number | null
          site_state: string | null
          site_zip: string | null
          sport_type: string | null
          status: string
          system_type: string | null
          target_completion_date: string | null
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          assigned_to?: string | null
          contract_value?: number | null
          created_at?: string
          customer_id?: string | null
          estimate_id?: string | null
          id?: string
          is_usta_funded?: boolean | null
          location_id?: string | null
          notes?: string | null
          project_name: string
          project_number?: string | null
          scheduled_start_date?: string | null
          site_address?: string | null
          site_city?: string | null
          site_lat?: number | null
          site_lng?: number | null
          site_state?: string | null
          site_zip?: string | null
          sport_type?: string | null
          status?: string
          system_type?: string | null
          target_completion_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          assigned_to?: string | null
          contract_value?: number | null
          created_at?: string
          customer_id?: string | null
          estimate_id?: string | null
          id?: string
          is_usta_funded?: boolean | null
          location_id?: string | null
          notes?: string | null
          project_name?: string
          project_number?: string | null
          scheduled_start_date?: string | null
          site_address?: string | null
          site_city?: string | null
          site_lat?: number | null
          site_lng?: number | null
          site_state?: string | null
          site_zip?: string | null
          sport_type?: string | null
          status?: string
          system_type?: string | null
          target_completion_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string | null
          email: string
          first_login_at: string | null
          full_name: string | null
          id: string
          invited_by: string
          roles: string[] | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          invited_by: string
          roles?: string[] | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          invited_by?: string
          roles?: string[] | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          permission_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          permission_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usta_applications: {
        Row: {
          completion_percentage: number | null
          consultant_email: string | null
          consultant_name: string | null
          courts_36_lined: number | null
          courts_36_permanent: number | null
          courts_60_lined: number | null
          courts_60_permanent: number | null
          courts_78: number | null
          created_at: string
          description_of_improvements: string | null
          facility_director: string | null
          facility_email: string | null
          facility_name: string | null
          facility_phone: string | null
          foundation_funding: number | null
          fundraising_amount: number | null
          government_funding: number | null
          id: string
          local_sponsors_amount: number | null
          other_funding: number | null
          other_funding_description: string | null
          pdf_url: string | null
          professional_fees: number | null
          project_id: string
          projected_completion_date: string | null
          status: string
          submitted_at: string | null
          total_renovation_costs: number | null
          tpa_number: string | null
          updated_at: string
          usta_national_amount: number | null
          usta_section_amount: number | null
        }
        Insert: {
          completion_percentage?: number | null
          consultant_email?: string | null
          consultant_name?: string | null
          courts_36_lined?: number | null
          courts_36_permanent?: number | null
          courts_60_lined?: number | null
          courts_60_permanent?: number | null
          courts_78?: number | null
          created_at?: string
          description_of_improvements?: string | null
          facility_director?: string | null
          facility_email?: string | null
          facility_name?: string | null
          facility_phone?: string | null
          foundation_funding?: number | null
          fundraising_amount?: number | null
          government_funding?: number | null
          id?: string
          local_sponsors_amount?: number | null
          other_funding?: number | null
          other_funding_description?: string | null
          pdf_url?: string | null
          professional_fees?: number | null
          project_id: string
          projected_completion_date?: string | null
          status?: string
          submitted_at?: string | null
          total_renovation_costs?: number | null
          tpa_number?: string | null
          updated_at?: string
          usta_national_amount?: number | null
          usta_section_amount?: number | null
        }
        Update: {
          completion_percentage?: number | null
          consultant_email?: string | null
          consultant_name?: string | null
          courts_36_lined?: number | null
          courts_36_permanent?: number | null
          courts_60_lined?: number | null
          courts_60_permanent?: number | null
          courts_78?: number | null
          created_at?: string
          description_of_improvements?: string | null
          facility_director?: string | null
          facility_email?: string | null
          facility_name?: string | null
          facility_phone?: string | null
          foundation_funding?: number | null
          fundraising_amount?: number | null
          government_funding?: number | null
          id?: string
          local_sponsors_amount?: number | null
          other_funding?: number | null
          other_funding_description?: string | null
          pdf_url?: string | null
          professional_fees?: number | null
          project_id?: string
          projected_completion_date?: string | null
          status?: string
          submitted_at?: string | null
          total_renovation_costs?: number | null
          tpa_number?: string | null
          updated_at?: string
          usta_national_amount?: number | null
          usta_section_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usta_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_staff: { Args: { _user_id: string }; Returns: boolean }
      is_manager_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_sales_or_above: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "owner"
        | "sales"
        | "project_manager"
        | "crew_lead"
        | "accounting"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "staff",
        "owner",
        "sales",
        "project_manager",
        "crew_lead",
        "accounting",
      ],
    },
  },
} as const
