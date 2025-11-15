// src/services/pdf.ts
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issue_date: number
  due_date: number
  currency: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_rate: number
  discount_amount: number
  total: number
  amount_paid: number
  notes?: string
  terms?: string
  // User/Business info
  user_name: string
  user_email: string
  business_name?: string
  business_address?: string
  business_phone?: string
  logo_url?: string
  // Client info
  client_name: string
  client_email: string
  company?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  client_tax_id?: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

interface InvoiceData {
  invoice: Invoice
  items: InvoiceItem[]
}

type InvoiceStatus = 'PAID' | 'SENT' | 'DRAFT' | 'OVERDUE'

export async function generateInvoicePDF(data: InvoiceData): Promise<ArrayBuffer> {
  const { invoice, items } = data
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = margin
  
  // ============= HEADER =============
  // Logo (if exists)
  if (invoice.logo_url) {
    try {
      // Note: You'd need to fetch and convert logo to base64
      // doc.addImage(logoBase64, 'PNG', margin, yPos, 40, 15)
      yPos += 20
    } catch (err) {
      console.error('Failed to add logo:', err)
    }
  }
  
  // Business info (left side)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.business_name || invoice.user_name, margin, yPos)
  yPos += 7
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  
  if (invoice.business_address) {
    const addressLines = invoice.business_address.split('\n')
    addressLines.forEach(line => {
      doc.text(line, margin, yPos)
      yPos += 4
    })
  }
  
  if (invoice.user_email) {
    doc.text(invoice.user_email, margin, yPos)
    yPos += 4
  }
  
  if (invoice.business_phone) {
    doc.text(invoice.business_phone, margin, yPos)
    yPos += 4
  }
  
  // Invoice title and number (right side)
  yPos = margin
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' })
  yPos += 10
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${invoice.invoice_number}`, pageWidth - margin, yPos, { align: 'right' })
  yPos += 15
  
  // Status badge
  yPos += 5
  const status = invoice.status.toUpperCase() as InvoiceStatus
  const statusColors: Record<InvoiceStatus, [number, number, number]> = {
    PAID: [34, 197, 94],
    SENT: [59, 130, 246],
    DRAFT: [156, 163, 175],
    OVERDUE: [239, 68, 68]
  }
  const statusColor = statusColors[status] || [156, 163, 175]
  
  doc.setFillColor(...statusColor)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const statusWidth = doc.getTextWidth(status) + 6
  doc.roundedRect(pageWidth - margin - statusWidth, yPos - 4, statusWidth, 6, 2, 2, 'F')
  doc.text(status, pageWidth - margin - statusWidth / 2, yPos, { align: 'center' })
  
  yPos = 65
  
  // ============= DATES & CLIENT INFO =============
  doc.setTextColor(0)
  doc.setFontSize(10)
  
  // Left side - Dates
  doc.setFont('helvetica', 'bold')
  doc.text('Invoice Date:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(invoice.issue_date * 1000).toLocaleDateString(), margin + 30, yPos)
  yPos += 6
  
  doc.setFont('helvetica', 'bold')
  doc.text('Due Date:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(invoice.due_date * 1000).toLocaleDateString(), margin + 30, yPos)
  yPos += 10
  
  // Bill To section
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('BILL TO:', margin, yPos)
  yPos += 6
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.client_name, margin, yPos)
  yPos += 5
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  if (invoice.company) {
    doc.text(invoice.company, margin, yPos)
    yPos += 4
  }
  
  if (invoice.address_line1) {
    doc.text(invoice.address_line1, margin, yPos)
    yPos += 4
  }
  
  if (invoice.address_line2) {
    doc.text(invoice.address_line2, margin, yPos)
    yPos += 4
  }
  
  const cityLine = [invoice.city, invoice.state, invoice.postal_code]
    .filter(Boolean)
    .join(', ')
  if (cityLine) {
    doc.text(cityLine, margin, yPos)
    yPos += 4
  }
  
  if (invoice.country) {
    doc.text(invoice.country, margin, yPos)
    yPos += 4
  }
  
  if (invoice.client_email) {
    doc.text(invoice.client_email, margin, yPos)
    yPos += 4
  }
  
  yPos += 10
  
  // ============= LINE ITEMS TABLE =============
  const tableStartY = yPos
  
  const tableData = items.map(item => [
    item.description,
    item.quantity.toString(),
    `${invoice.currency} ${item.unit_price.toFixed(2)}`,
    `${invoice.currency} ${item.amount.toFixed(2)}`
  ])
  
  // @ts-ignore - jspdf-autotable types are not perfect
  doc.autoTable({
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 5
    },
    margin: { left: margin, right: margin }
  })
  
  // @ts-ignore - accessing lastAutoTable property
  yPos = doc.lastAutoTable.finalY + 10
  
  // ============= TOTALS =============
  const totalsX = pageWidth - margin - 60
  const labelX = totalsX - 5
  const valueX = pageWidth - margin
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Subtotal
  doc.text('Subtotal:', labelX, yPos, { align: 'right' })
  doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 6
  
  // Tax
  if (invoice.tax_rate > 0) {
    doc.text(`Tax (${invoice.tax_rate}%):`, labelX, yPos, { align: 'right' })
    doc.text(`${invoice.currency} ${invoice.tax_amount.toFixed(2)}`, valueX, yPos, { align: 'right' })
    yPos += 6
  }
  
  // Discount
  if (invoice.discount_rate > 0) {
    doc.setTextColor(220, 38, 38)
    doc.text(`Discount (${invoice.discount_rate}%):`, labelX, yPos, { align: 'right' })
    doc.text(`-${invoice.currency} ${invoice.discount_amount.toFixed(2)}`, valueX, yPos, { align: 'right' })
    yPos += 6
    doc.setTextColor(0)
  }
  
  // Total line
  doc.setLineWidth(0.5)
  doc.line(totalsX - 5, yPos, valueX, yPos)
  yPos += 7
  
  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', labelX, yPos, { align: 'right' })
  doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, valueX, yPos, { align: 'right' })
  yPos += 3
  
  // Amount paid (if any)
  if (invoice.amount_paid > 0) {
    yPos += 5
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(34, 197, 94)
    doc.text('Amount Paid:', labelX, yPos, { align: 'right' })
    doc.text(`${invoice.currency} ${invoice.amount_paid.toFixed(2)}`, valueX, yPos, { align: 'right' })
    yPos += 6
    
    // Balance due
    const balanceDue = invoice.total - invoice.amount_paid
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text('Balance Due:', labelX, yPos, { align: 'right' })
    doc.text(`${invoice.currency} ${balanceDue.toFixed(2)}`, valueX, yPos, { align: 'right' })
  }
  
  // ============= NOTES & TERMS =============
  yPos += 15
  
  if (invoice.notes) {
    if (yPos > pageHeight - 50) {
      doc.addPage()
      yPos = margin
    }
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Notes:', margin, yPos)
    yPos += 6
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60)
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(notesLines, margin, yPos)
    yPos += notesLines.length * 4 + 8
  }
  
  if (invoice.terms) {
    if (yPos > pageHeight - 50) {
      doc.addPage()
      yPos = margin
    }
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Terms & Conditions:', margin, yPos)
    yPos += 6
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60)
    const termsLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin)
    doc.text(termsLines, margin, yPos)
    yPos += termsLines.length * 4
  }
  
  // ============= FOOTER =============
  const footerY = pageHeight - 15
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )
  
  // Convert to ArrayBuffer
  const pdfBlob = doc.output('arraybuffer')
  return pdfBlob
}

// Alternative: Generate using @react-pdf/renderer (more React-like)
// This would be better for complex layouts but requires more setup
