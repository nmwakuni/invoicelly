'use client'

import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { DollarSign, Calendar, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      // This endpoint doesn't exist in our API yet, but here's the structure
      const { data } = await paymentsApi.getAll()
      return data.payments
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  // For now, show placeholder since we don't have a payments list endpoint
  const mockPayments = [
    {
      id: '1',
      invoiceNumber: 'INV-0001',
      clientName: 'John Doe',
      amount: 1500,
      currency: 'USD',
      paymentDate: Date.now() / 1000,
      paymentMethod: 'bank_transfer',
      reference: 'TXN-12345',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-gray-500 mt-1">
          Track all payment transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(1500)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(500)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {mockPayments.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No payments yet"
              description="Payments will appear here once invoices are paid"
            />
          ) : (
            <div className="space-y-4">
              {mockPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{payment.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">{payment.clientName}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payment.paymentDate)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {payment.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-green-600">
                      +{formatCurrency(payment.amount)} {payment.currency}
                    </p>
                    {payment.reference && (
                      <p className="text-xs text-gray-400">Ref: {payment.reference}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
