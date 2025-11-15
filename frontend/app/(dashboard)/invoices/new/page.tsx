'use client'

import { InvoiceForm } from '@/components/invoices/invoice-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewInvoicePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <p className="text-gray-500 mt-1">
          Create a new invoice for your client
        </p>
      </div>

      <InvoiceForm />
    </div>
  )
}
