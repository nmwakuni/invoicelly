'use client'

import { Invoice, InvoiceItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface InvoicePDFProps {
  invoice: Invoice
  items: InvoiceItem[]
}

export function InvoicePDF({ invoice, items }: InvoicePDFProps) {
  // This is a simplified preview component
  // In production, you'd use a library like react-pdf or generate PDFs server-side
  
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
          <p className="text-gray-600 mt-2">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">Your Business Name</p>
          <p className="text-sm text-gray-600">123 Business Street</p>
          <p className="text-sm text-gray-600">City, State 12345</p>
          <p className="text-sm text-gray-600">email@business.com</p>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm mb-2">BILL TO:</p>
        <p className="font-semibold text-gray-900">{invoice.clientName}</p>
        <p className="text-sm text-gray-600">{invoice.clientEmail}</p>
      </div>

      {/* Dates */}
      <div className="flex gap-8 mb-8">
        <div>
          <p className="text-gray-500 text-sm">Issue Date</p>
          <p className="font-medium">
            {format(new Date(invoice.issueDate * 1000), 'MMM dd, yyyy')}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Due Date</p>
          <p className="font-medium">
            {format(new Date(invoice.dueDate * 1000), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead className="border-b-2 border-gray-900">
          <tr>
            <th className="text-left py-3 text-sm font-semibold">DESCRIPTION</th>
            <th className="text-right py-3 text-sm font-semibold">QTY</th>
            <th className="text-right py-3 text-sm font-semibold">RATE</th>
            <th className="text-right py-3 text-sm font-semibold">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-3">{item.description}</td>
              <td className="text-right py-3">{item.quantity}</td>
              <td className="text-right py-3">
                {formatCurrency(item.unitPrice)}
              </td>
              <td className="text-right py-3">
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          {invoice.taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
              <span className="font-medium">
                {formatCurrency(invoice.taxAmount)}
              </span>
            </div>
          )}
          {invoice.discountRate > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount ({invoice.discountRate}%):</span>
              <span>-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t-2 border-gray-900">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg">
              {formatCurrency(invoice.total)} {invoice.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-8">
          <p className="text-gray-500 text-sm mb-2">NOTES:</p>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Terms */}
      {invoice.terms && (
        <div>
          <p className="text-gray-500 text-sm mb-2">TERMS & CONDITIONS:</p>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.terms}</p>
        </div>
      )}
    </div>
  )
}
