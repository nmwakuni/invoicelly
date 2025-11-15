'use client'

import { useParams, useRouter } from 'next/navigation'
import { useInvoice, useMarkInvoicePaid, useDeleteInvoice, useSendInvoice } from '@/lib/hooks/use-invoices'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  Edit, Send, Download, Trash2, CheckCircle, 
  Mail, Calendar 
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const { data, isLoading } = useInvoice(invoiceId)
  const markPaid = useMarkInvoicePaid()
  const deleteInvoice = useDeleteInvoice()
  const sendInvoice = useSendInvoice()

  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
  })

  if (isLoading) return <LoadingSpinner />

  const invoice = data?.invoice
  const items = data?.items || []
  const payments = data?.payments || []

  if (!invoice) {
    return <div>Invoice not found</div>
  }

  const handleMarkPaid = async () => {
    if (confirm('Mark this invoice as paid?')) {
      await markPaid.mutateAsync(invoiceId)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice.mutateAsync(invoiceId)
      router.push('/invoices')
    }
  }

  const handleSendInvoice = async () => {
    await sendInvoice.mutateAsync({
      id: invoiceId,
      data: emailData,
    })
    setSendDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-gray-500">
            Issued: {format(new Date(invoice.issueDate * 1000), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <>
              <Link href={`/invoices/${invoiceId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={() => setSendDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </>
          )}

          {invoice.pdfUrl && (
            <Button variant="outline" asChild>
              <a href={invoice.pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}

          {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
            <Button onClick={handleMarkPaid} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Paid
            </Button>
          )}

          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bill To */}
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{invoice.clientName}</p>
              </div>

              {invoice.clientEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${invoice.clientEmail}`} className="text-blue-600 hover:underline">
                    {invoice.clientEmail}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start pb-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {formatCurrency(item.unitPrice)} {invoice.currency}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.amount)} {invoice.currency}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)} {invoice.currency}</span>
                </div>

                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(invoice.taxAmount)} {invoice.currency}</span>
                  </div>
                )}

                {invoice.discountRate > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount ({invoice.discountRate}%)</span>
                    <span>-{formatCurrency(invoice.discountAmount)} {invoice.currency}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)} {invoice.currency}</span>
                </div>

                {invoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Amount Paid</span>
                      <span>{formatCurrency(invoice.amountPaid)} {invoice.currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Balance Due</span>
                      <span>{formatCurrency(invoice.total - invoice.amountPaid)} {invoice.currency}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {invoice.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-500">Issue Date</p>
                  <p className="font-medium">
                    {format(new Date(invoice.issueDate * 1000), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium">
                    {format(new Date(invoice.dueDate * 1000), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {invoice.paidDate && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-gray-500">Paid On</p>
                    <p className="font-medium">
                      {format(new Date(invoice.paidDate * 1000), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="pb-3 border-b last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium">
                          {formatCurrency(payment.amount)} {payment.currency}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(payment.paymentDate * 1000), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                      {payment.reference && (
                        <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Send Invoice Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Send this invoice to your client via email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder={invoice.clientEmail || 'client@example.com'}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder={`Invoice ${invoice.invoiceNumber}`}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Please find your invoice attached..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendInvoice}>
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
