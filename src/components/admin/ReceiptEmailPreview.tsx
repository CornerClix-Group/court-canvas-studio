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
import { Mail, Loader2, Download } from "lucide-react";
import {
  generateReceiptEmailHTML,
  getReceiptEmailSubject,
  generateStandaloneReceiptEmailHTML,
  getStandaloneReceiptEmailSubject,
  PaymentForReceipt,
  InvoiceForReceipt,
  CustomerForReceipt,
} from "@/lib/receiptEmailTemplate";

interface ReceiptEmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentForReceipt;
  invoice: InvoiceForReceipt | null;
  customer: CustomerForReceipt;
  onSendEmail: () => void;
  sending: boolean;
}

export function ReceiptEmailPreview({
  open,
  onOpenChange,
  payment,
  invoice,
  customer,
  onSendEmail,
  sending,
}: ReceiptEmailPreviewProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  
  const isStandalone = !invoice;
  const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
  
  const htmlContent = isStandalone
    ? generateStandaloneReceiptEmailHTML(payment, customer)
    : generateReceiptEmailHTML(payment, invoice, customer);
    
  const subject = isStandalone
    ? getStandaloneReceiptEmailSubject(receiptNumber, payment.payment_type || 'payment')
    : getReceiptEmailSubject(receiptNumber);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-receipt-pdf", {
        body: { paymentId: payment.id },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = data.pdfUrl;
      link.download = `${data.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Receipt Downloaded",
        description: `Downloaded ${data.receiptNumber}.pdf`,
      });
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message || "Failed to generate receipt PDF",
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
            {isStandalone ? 'Standalone Payment Receipt Preview' : 'Receipt Email Preview'}
          </DialogTitle>
          <DialogDescription>
            Review the receipt email before sending to the customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Email Metadata */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground font-medium min-w-20">To:</span>
              <span className="font-medium">
                {customer.email || (
                  <span className="text-destructive">No email address</span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground font-medium min-w-20">Subject:</span>
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
                srcDoc={htmlContent}
                title="Receipt Email Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleDownloadPdf} 
            disabled={downloading || sending}
            className="gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending || downloading}>
            Cancel
          </Button>
          <Button 
            onClick={onSendEmail} 
            disabled={sending || downloading || !customer.email}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Receipt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
