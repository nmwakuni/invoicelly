// components/dashboard/recent-invoices.tsx
'use client'

import { useInvoices } from '@/lib/hooks/use-invoices'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

export function RecentInvoices() {
  const { data: invoices, isLoading } = useInvoices()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!invoices || invoices.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        description="Create your first invoice to get started"
        action={{
          label: 'Create Invoice',
          onClick: () => (window.location.href = '/invoices/new'),
        }}
      />
    )
  }

  const recentInvoices = invoices.slice(0, 5)

  return (
    <div className="space-y-3">
      {recentInvoices.map((invoice) => (
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

      <div className="pt-3">
        <Link href="/invoices">
          <Button variant="outline" className="w-full">
            View All Invoices
          </Button>
        </Link>
      </div>
    </div>
  )
}
