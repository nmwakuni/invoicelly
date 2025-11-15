// app/(dashboard)/clients/[id]/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useClient } from '@/lib/hooks/use-clients'
import { useInvoices } from '@/lib/hooks/use-invoices'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Mail, Phone, MapPin, Building, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { useDeleteClient } from '@/lib/hooks/use-clients'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { data, isLoading } = useClient(clientId)
  const { data: invoices } = useInvoices({ clientId })
  const deleteClient = useDeleteClient()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient.mutateAsync(clientId)
        router.push('/clients')
      } catch (error) {
        // Error handled by mutation
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const client = data?.client
  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client?.name}</h1>
          {client?.company && (
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Building className="h-4 w-4" />
              {client.company}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${clientId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.totalPaid || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.totalOutstanding || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info & Invoices */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client?.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-sm font-medium hover:text-blue-600"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            {client?.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm font-medium hover:text-blue-600"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {(client?.addressLine1 || client?.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <div className="text-sm font-medium">
                    {client.addressLine1 && <p>{client.addressLine1}</p>}
                    {client.addressLine2 && <p>{client.addressLine2}</p>}
                    {client.city && (
                      <p>
                        {[client.city, client.state, client.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {client.country && <p>{client.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {client?.taxId && (
              <div>
                <p className="text-sm text-gray-500">Tax ID</p>
                <p className="text-sm font-medium">{client.taxId}</p>
              </div>
            )}

            {client?.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <Link href={`/invoices/new?clientId=${clientId}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!invoices || invoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No invoices yet</p>
                <Link href={`/invoices/new?clientId=${clientId}`}>
                  <Button>Create First Invoice</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="text-sm text-gray-500">
                        Due: {format(new Date(invoice.dueDate * 1000), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(invoice.total)} {invoice.currency}
                      </p>
                      {invoice.amountPaid > 0 && (
                        <p className="text-sm text-green-600">
                          {formatCurrency(invoice.amountPaid)} paid
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
