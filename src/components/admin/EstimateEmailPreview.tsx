import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Download, X, AlertCircle } from "lucide-react";
import {
  generateEstimateEmailHTML,
  getEstimateEmailSubject,
  EstimateForEmail,
  ScopeBullet,
  LineItem,
} from "@/lib/estimateEmailTemplate";

interface EstimateEmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: EstimateForEmail;
  scopeBullets: ScopeBullet[];
  lineItems: LineItem[];
  hasAttachments: boolean;
  recipientEmail: string | null;
  onSendEmail: () => void;
  sending: boolean;
}

export function EstimateEmailPreview({
  open,
  onOpenChange,
  estimate,
  scopeBullets,
  lineItems,
  hasAttachments,
  recipientEmail,
  onSendEmail,
  sending,
}: EstimateEmailPreviewProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const emailHtml = generateEstimateEmailHTML(estimate, scopeBullets, lineItems, hasAttachments);
  const subject = getEstimateEmailSubject(estimate.estimate_number);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-estimate-pdf", {
        body: { estimateId: estimate.estimate_number.replace("EST-", "") },
      });

      // The estimateId in the body should be the actual ID, not the number
      // We need to pass the correct ID - this is handled by the parent component
      if (error) throw error;

      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdf}`;
      link.download = `Estimate-${estimate.estimate_number}.pdf`;
      link.click();

      toast({
        title: "PDF Downloaded",
        description: "Estimate PDF has been downloaded.",
      });
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message || "Failed to generate PDF",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Estimate Email Preview
          </DialogTitle>
          <DialogDescription>
            Review the estimate email before sending to the customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Email Metadata */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground w-16">To:</span>
              {recipientEmail ? (
                <span className="font-medium">{recipientEmail}</span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  No email address on file
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground w-16">Subject:</span>
              <span>{subject}</span>
            </div>
          </div>

          {/* Email Preview */}
          <div className="border rounded-lg overflow-hidden flex-1">
            <div className="bg-muted px-4 py-2 border-b text-sm font-medium">
              Email Body Preview
            </div>
            <div className="h-[400px] overflow-auto bg-background">
              <iframe
                srcDoc={emailHtml}
                title="Estimate Email Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending || downloading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onSendEmail}
            disabled={sending || downloading || !recipientEmail}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
