import { Invoice } from '@/lib/types'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface InvoiceListProps {
  invoices: Invoice[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="font-medium">{invoice.invoiceNumber}</p>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-gray-500">{invoice.clientName}</p>
            <p className="text-xs text-gray-400">
              Due: {format(new Date(invoice.dueDate * 1000), 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(invoice.total)} {invoice.currency}
            </p>
            {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
              <p className="text-xs text-gray-500">
                {formatCurrency(invoice.amountPaid)} paid
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
