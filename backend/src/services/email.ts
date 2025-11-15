// src/services/email.ts
import { Resend } from 'resend'

interface SendInvoiceEmailParams {
  to: string
  subject: string
  message?: string
  invoice: any
  pdfUrl: string
}

interface EmailEnv {
  RESEND_API_KEY: string
  EMAIL_FROM_DOMAIN?: string
}

export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams,
  env: EmailEnv
) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(env.RESEND_API_KEY)
  
  const { to, subject, message, invoice, pdfUrl } = params
  
  // Fetch PDF from R2
  const pdfResponse = await fetch(pdfUrl)
  const pdfBuffer = await pdfResponse.arrayBuffer()
  
  // Create email HTML
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #fff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .invoice-details {
          background: #f9fafb;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .invoice-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .invoice-details td {
          padding: 8px 0;
        }
        .invoice-details td:first-child {
          font-weight: 600;
          color: #6b7280;
        }
        .invoice-details td:last-child {
          text-align: right;
        }
        .total {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .button:hover {
          background: #5568d3;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
          margin-top: 30px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-sent {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-overdue {
          background: #fee2e2;
          color: #991b1b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📄 Invoice from ${invoice.business_name || invoice.user_name}</h1>
      </div>
      
      <div class="content">
        ${message ? `<p>${message}</p>` : ''}
        
        <p>Hello ${invoice.client_name},</p>
        
        <p>Please find attached invoice <strong>#${invoice.invoice_number}</strong> for your review.</p>
        
        <div class="invoice-details">
          <table>
            <tr>
              <td>Invoice Number:</td>
              <td><strong>#${invoice.invoice_number}</strong></td>
            </tr>
            <tr>
              <td>Issue Date:</td>
              <td>${new Date(invoice.issue_date * 1000).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Due Date:</td>
              <td>${new Date(invoice.due_date * 1000).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Status:</td>
              <td>
                <span class="status-badge status-${invoice.status}">
                  ${invoice.status}
                </span>
              </td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td><strong>Amount Due:</strong></td>
              <td class="total">${invoice.currency} ${invoice.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <p>You can download the invoice PDF attached to this email, or view it online:</p>
        
        <center>
          <a href="${pdfUrl}" class="button">View Invoice</a>
        </center>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          If you have any questions about this invoice, please contact us at 
          <a href="mailto:${invoice.user_email}">${invoice.user_email}</a>
        </p>
      </div>
      
      <div class="footer">
        <p>This is an automated message from ${invoice.business_name || invoice.user_name}</p>
        <p style="font-size: 12px; color: #9ca3af;">
          Please do not reply to this email. For inquiries, contact ${invoice.user_email}
        </p>
      </div>
    </body>
    </html>
  `
  
  // Convert ArrayBuffer to base64 for Resend
  const base64Pdf = arrayBufferToBase64(pdfBuffer)
  
  // Send email
  const fromDomain = env.EMAIL_FROM_DOMAIN || 'yourdomain.com'
  const result = await resend.emails.send({
    from: `${invoice.business_name || invoice.user_name} <invoices@${fromDomain}>`,
    to,
    subject,
    html: emailHtml,
    attachments: [
      {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: base64Pdf
      }
    ],
    tags: [
      { name: 'type', value: 'invoice' },
      { name: 'invoice_id', value: invoice.id }
    ]
  })
  
  return result
}

// Send payment reminder
export async function sendPaymentReminder(
  invoice: any,
  env: EmailEnv
) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(env.RESEND_API_KEY)
  
  const daysOverdue = Math.floor(
    (Date.now() - invoice.due_date * 1000) / (1000 * 60 * 60 * 24)
  )
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .reminder-header {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #dc2626;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>⚠️ Payment Reminder</h1>
      
      <p>Hello ${invoice.client_name},</p>
      
      <div class="reminder-header">
        <strong>This is a friendly reminder that invoice #${invoice.invoice_number} is ${daysOverdue} days overdue.</strong>
      </div>
      
      <p>Invoice Details:</p>
      <ul>
        <li><strong>Invoice Number:</strong> #${invoice.invoice_number}</li>
        <li><strong>Due Date:</strong> ${new Date(invoice.due_date * 1000).toLocaleDateString()}</li>
        <li><strong>Days Overdue:</strong> ${daysOverdue} days</li>
      </ul>
      
      <div class="amount">
        Amount Due: ${invoice.currency} ${invoice.total.toFixed(2)}
      </div>
      
      <p>Please remit payment at your earliest convenience.</p>
      
      <center>
        <a href="${invoice.pdf_url}" class="button">View Invoice</a>
      </center>
      
      <p style="margin-top: 30px;">
        If you have already sent payment, please disregard this reminder.
        If you have any questions, please contact us at ${invoice.user_email}
      </p>
      
      <p>Thank you,<br>${invoice.business_name || invoice.user_name}</p>
    </body>
    </html>
  `
  
  const fromDomain = env.EMAIL_FROM_DOMAIN || 'yourdomain.com'
  return await resend.emails.send({
    from: `${invoice.business_name || invoice.user_name} <invoices@${fromDomain}>`,
    to: invoice.client_email,
    subject: `Payment Reminder: Invoice #${invoice.invoice_number} is ${daysOverdue} days overdue`,
    html: emailHtml
  })
}

// Utility function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
