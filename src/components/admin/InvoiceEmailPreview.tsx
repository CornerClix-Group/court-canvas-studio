import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, X, Loader2, AlertCircle } from "lucide-react";
import { generateInvoiceEmailHTML, getEmailSubject, LineItem, InvoiceForEmail } from "@/lib/invoiceEmailTemplate";

interface InvoiceEmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceForEmail;
  lineItems: LineItem[];
  recipientEmail: string | null;
  onSendEmail: () => void;
  sending: boolean;
}

export function InvoiceEmailPreview({
  open,
  onOpenChange,
  invoice,
  lineItems,
  recipientEmail,
  onSendEmail,
  sending,
}: InvoiceEmailPreviewProps) {
  const emailHtml = generateInvoiceEmailHTML(invoice, lineItems);
  const subject = getEmailSubject(invoice.invoice_number);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            Review the invoice email before sending
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Email metadata */}
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

          {/* Email preview iframe */}
          <div className="flex-1 border rounded-lg overflow-hidden bg-white min-h-[400px]">
            <iframe
              srcDoc={emailHtml}
              title="Invoice Email Preview"
              className="w-full h-full min-h-[400px]"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onSendEmail}
            disabled={sending || !recipientEmail}
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
