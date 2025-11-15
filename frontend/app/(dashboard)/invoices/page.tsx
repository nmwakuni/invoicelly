// app/(dashboard)/invoices/page.tsx
'use client'

import { useState } from 'react'
import { useInvoices } from '@/lib/hooks/use-invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { FileText } from 'lucide-react'
import { InvoiceTable } from '@/components/invoices/invoice-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { data: invoices, isLoading } = useInvoices(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  )

  const filteredInvoices = invoices?.filter((invoice) => {
    const query = searchQuery.toLowerCase()
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.clientName?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to get started with billing"
          action={{
            label: 'Create Invoice',
            onClick: () => (window.location.href = '/invoices/new'),
          }}
        />
      ) : filteredInvoices && filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No invoices found matching your search</p>
        </div>
      ) : (
        <InvoiceTable
          invoices={
            (filteredInvoices || []).map((invoice) => ({
              ...invoice,
              issueDate: invoice.issueDate
                ? typeof invoice.issueDate === 'string'
                  ? invoice.issueDate
                  : new Date(invoice.issueDate).toISOString()
                : undefined,
              dueDate: invoice.dueDate
                ? typeof invoice.dueDate === 'string'
                  ? invoice.dueDate
                  : new Date(invoice.dueDate).toISOString()
                : undefined,
            }))
          }
        />
      )}
    </div>
  )
}
