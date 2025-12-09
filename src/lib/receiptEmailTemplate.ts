// Client-side replica of receipt email template for preview

const COMPANY_INFO = {
  name: "CourtHaus Construction, LLC dba CourtPro Augusta",
  address: "3651 Walton Way Extension",
  cityStateZip: "Augusta, GA 30909",
  phone: "(762) 123-4567",
  email: "accounts@courtproaugusta.com",
};

export interface PaymentForReceipt {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  payment_type?: string;
  description?: string | null;
}

export interface InvoiceForReceipt {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number | null;
}

export interface CustomerForReceipt {
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return "Other";
  const methods: Record<string, string> = {
    check: "Check",
    bank_transfer: "Bank Transfer",
    credit_card: "Credit Card",
    cash: "Cash",
    ach: "ACH",
    wire: "Wire Transfer",
    other: "Other",
  };
  return methods[method] || method;
}

function formatPaymentType(type: string | null): string {
  if (!type) return "Payment";
  const types: Record<string, string> = {
    invoice_payment: "Invoice Payment",
    deposit: "Deposit",
    prepayment: "Prepayment",
    miscellaneous: "Miscellaneous Payment",
  };
  return types[type] || type;
}

export function generateReceiptEmailHTML(
  payment: PaymentForReceipt,
  invoice: InvoiceForReceipt,
  customer: CustomerForReceipt
): string {
  const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
  const remainingBalance = invoice.total - (invoice.amount_paid || 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt ${receiptNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #10b981; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Payment Receipt</h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">${receiptNumber}</p>
                </td>
              </tr>

              <!-- Thank You Message -->
              <tr>
                <td style="padding: 30px 40px 20px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 18px; color: #333333;">
                    Thank you for your payment, <strong>${customer.contact_name}</strong>!
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666666;">
                    We have received your payment of <strong style="color: #10b981; font-size: 16px;">${formatCurrency(payment.amount)}</strong>
                  </p>
                </td>
              </tr>

              <!-- Payment Details -->
              <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Date</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatDate(payment.payment_date)}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Method</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatPaymentMethod(payment.payment_method)}</td>
                          </tr>
                          ${payment.reference_number ? `
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Reference Number</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${payment.reference_number}</td>
                          </tr>
                          ` : ""}
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Amount Paid</td>
                            <td style="color: #10b981; font-size: 16px; font-weight: 600; text-align: right;">${formatCurrency(payment.amount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Invoice Details -->
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Invoice Information</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Invoice Number</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${invoice.invoice_number}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Invoice Total</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatCurrency(invoice.total)}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Total Paid to Date</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatCurrency(invoice.amount_paid || 0)}</td>
                          </tr>
                          <tr style="border-top: 1px solid #e5e7eb;">
                            <td style="color: #666666; font-size: 14px; padding-top: 12px;">Remaining Balance</td>
                            <td style="color: ${remainingBalance > 0 ? '#f59e0b' : '#10b981'}; font-size: 16px; font-weight: 600; text-align: right; padding-top: 12px;">
                              ${remainingBalance <= 0 ? 'PAID IN FULL' : formatCurrency(remainingBalance)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Company Info Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #333333;">${COMPANY_INFO.name}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.address}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.cityStateZip}</p>
                        <p style="margin: 0; font-size: 13px; color: #666666;">${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer Message -->
              <tr>
                <td style="padding: 20px 40px; text-align: center; background-color: #ffffff;">
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    This is an automated receipt for your records. If you have any questions about this payment, please contact us.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getReceiptEmailSubject(receiptNumber: string): string {
  return `Payment Receipt ${receiptNumber} - CourtHaus Construction, LLC dba CourtPro Augusta`;
}

// Standalone payment receipt (no invoice)
export function generateStandaloneReceiptEmailHTML(
  payment: PaymentForReceipt,
  customer: CustomerForReceipt
): string {
  const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
  const paymentTypeLabel = formatPaymentType(payment.payment_type || null);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${paymentTypeLabel} Receipt ${receiptNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${paymentTypeLabel} Receipt</h1>
                  <p style="margin: 10px 0 0 0; color: #bfdbfe; font-size: 14px;">${receiptNumber}</p>
                </td>
              </tr>

              <!-- Thank You Message -->
              <tr>
                <td style="padding: 30px 40px 20px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 18px; color: #333333;">
                    Thank you for your ${paymentTypeLabel.toLowerCase()}, <strong>${customer.contact_name}</strong>!
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666666;">
                    We have received your ${paymentTypeLabel.toLowerCase()} of <strong style="color: #3b82f6; font-size: 16px;">${formatCurrency(payment.amount)}</strong>
                  </p>
                </td>
              </tr>

              <!-- Payment Details -->
              <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Type</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${paymentTypeLabel}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Date</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatDate(payment.payment_date)}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Method</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatPaymentMethod(payment.payment_method)}</td>
                          </tr>
                          ${payment.reference_number ? `
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Reference Number</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${payment.reference_number}</td>
                          </tr>
                          ` : ""}
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Amount Received</td>
                            <td style="color: #3b82f6; font-size: 16px; font-weight: 600; text-align: right;">${formatCurrency(payment.amount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${payment.description ? `
              <!-- Description -->
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Description</h3>
                        <p style="margin: 0; font-size: 14px; color: #333333;">${payment.description}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ""}

              <!-- Note -->
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px 20px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 14px; color: #1e40af;">
                      This ${paymentTypeLabel.toLowerCase()} will be applied to your account. If you have any questions, please don't hesitate to contact us.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Company Info Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #333333;">${COMPANY_INFO.name}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.address}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.cityStateZip}</p>
                        <p style="margin: 0; font-size: 13px; color: #666666;">${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer Message -->
              <tr>
                <td style="padding: 20px 40px; text-align: center; background-color: #ffffff;">
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    This is an automated receipt for your records. If you have any questions about this payment, please contact us.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getStandaloneReceiptEmailSubject(receiptNumber: string, paymentType: string): string {
  const typeLabel = formatPaymentType(paymentType);
  return `${typeLabel} Receipt ${receiptNumber} - CourtHaus Construction, LLC dba CourtPro Augusta`;
}
