import React from 'react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export interface InvoiceTableProps {
  invoices: Array<{
    id: string
    invoiceNumber: string
    clientName?: string
    issueDate?: string
    dueDate?: string
    total: number
    status: string
  }>
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-700">{invoice.invoiceNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.clientName || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{formatCurrency(invoice.total)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge variant={
                  invoice.status === 'paid' ? 'default' :
                  invoice.status === 'overdue' ? 'destructive' :
                  invoice.status === 'sent' ? 'default' :
                  invoice.status === 'draft' ? 'secondary' : 'outline'
                }>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <a href={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
