// Client-side replica of the edge function email template for preview purposes

const COMPANY_INFO = {
  name: "CourtHaus Construction, LLC",
  dba: "CourtPro Augusta",
  address: "500 Furys Ferry Rd. Suite 107",
  city: "Augusta",
  state: "GA",
  zip: "30907",
  phone: "(706) 309-1993",
  email: "billing@courtproaugusta.com",
};

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit?: string;
}

export interface InvoiceForEmail {
  invoice_number: string;
  due_date: string | null;
  notes: string | null;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  customer: {
    contact_name: string;
    company_name?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Upon Receipt';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateInvoiceEmailHTML(invoice: InvoiceForEmail, lineItems: LineItem[]): string {
  const lineItemsHtml = lineItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${item.unit || 'each'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">${COMPANY_INFO.name}</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">dba ${COMPANY_INFO.dba}</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 24px;">INVOICE</h2>
        <p style="margin: 0; color: #64748b;"><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
        <p style="margin: 5px 0 0 0; color: #64748b;"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${COMPANY_INFO.address}</p>
        <p style="margin: 0; font-size: 14px; color: #64748b;">${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}</p>
        <p style="margin: 0; font-size: 14px; color: #64748b;">${COMPANY_INFO.phone}</p>
        <p style="margin: 0; font-size: 14px; color: #64748b;">${COMPANY_INFO.email}</p>
      </div>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Bill To:</h3>
      <p style="margin: 0; font-weight: bold; font-size: 16px;">${invoice.customer?.contact_name || 'Customer'}</p>
      ${invoice.customer?.company_name ? `<p style="margin: 5px 0 0 0; color: #64748b;">${invoice.customer.company_name}</p>` : ''}
      ${invoice.customer?.address ? `<p style="margin: 5px 0 0 0; color: #64748b;">${invoice.customer.address}</p>` : ''}
      ${invoice.customer?.city ? `<p style="margin: 0; color: #64748b;">${invoice.customer.city}, ${invoice.customer.state || ''} ${invoice.customer.zip || ''}</p>` : ''}
      ${invoice.customer?.email ? `<p style="margin: 5px 0 0 0; color: #64748b;">${invoice.customer.email}</p>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">Description</th>
          <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">Quantity</th>
          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">Unit Price</th>
          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <div style="margin-top: 20px; background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #64748b;">Subtotal:</span>
            <span style="font-weight: 500;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${invoice.tax_amount && invoice.tax_amount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #64748b;">Tax (${invoice.tax_rate || 0}%):</span>
            <span style="font-weight: 500;">${formatCurrency(invoice.tax_amount)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; color: #1e40af;">
            <span>Total Due:</span>
            <span>${formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Flexible Payment Options Banner -->
    <div style="margin-top: 24px; background: linear-gradient(135deg, #059669 0%, #0891b2 100%); padding: 20px; border-radius: 8px; text-align: center;">
      <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">💳 Flexible Payment Options</h3>
      <p style="color: #d1fae5; margin: 0; font-size: 14px;">
        Finance with Klarna - Pay in 4 or spread over time
      </p>
      <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 12px;">
        Cards, Apple Pay, Cash App, Amazon Pay • 🏦 <strong>Bank Transfer - No Fee!</strong>
      </p>
    </div>

    ${invoice.notes ? `
    <div style="margin-top: 20px; background: #fefce8; padding: 20px; border-radius: 8px; border: 1px solid #fef08a;">
      <h3 style="margin: 0 0 10px 0; color: #854d0e; font-size: 14px; text-transform: uppercase;">Notes:</h3>
      <p style="margin: 0; color: #713f12; white-space: pre-wrap;">${invoice.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 30px; background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
      <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px;">Payment Instructions</h3>
      <p style="margin: 0; color: #166534;">Please make checks payable to <strong>${COMPANY_INFO.name}</strong> and mail to:</p>
      <p style="margin: 10px 0 0 0; color: #166534; font-weight: 500;">
        ${COMPANY_INFO.address}<br>
        ${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zip}
      </p>
      <p style="margin: 15px 0 0 0; color: #166534;">For questions, contact us at <strong>${COMPANY_INFO.phone}</strong> or <strong>${COMPANY_INFO.email}</strong></p>
    </div>
  </div>

  <div style="background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
    <p style="margin: 0;">Thank you for your business!</p>
    <p style="margin: 5px 0 0 0;">${COMPANY_INFO.name} | ${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
  </div>
</body>
</html>
  `;
}

export function getEmailSubject(invoiceNumber: string): string {
  return `Invoice ${invoiceNumber} from ${COMPANY_INFO.name} dba ${COMPANY_INFO.dba}`;
}
