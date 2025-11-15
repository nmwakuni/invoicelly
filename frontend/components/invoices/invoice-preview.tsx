// components/invoices/invoice-table.tsx
'use client'

import Link from 'next/link'
import { Invoice } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Edit, Send, Trash2, Download } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InvoiceTableProps {
  invoices: Invoice[]
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="font-medium hover:text-blue-600"
                >
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>{invoice.clientName}</TableCell>
              <TableCell>
                {format(new Date(invoice.issueDate * 1000), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {format(new Date(invoice.dueDate * 1000), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {formatCurrency(invoice.total)} {invoice.currency}
                  </p>
                  {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
                    <p className="text-xs text-gray-500">
                      {formatCurrency(invoice.amountPaid)} paid
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    {invoice.status === 'draft' && (
                      <DropdownMenuItem asChild>
                        <Link href={`/invoices/${invoice.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {invoice.pdfUrl && (
                      <DropdownMenuItem asChild>
                        <a href={invoice.pdfUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </a>
                      </DropdownMenuItem>
                    )}
                    {invoice.status === 'draft' && (
                      <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invoice
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
