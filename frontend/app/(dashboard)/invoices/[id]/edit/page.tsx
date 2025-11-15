'use client'

import { useParams } from 'next/navigation'
import { useInvoice } from '@/lib/hooks/use-invoices'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

export default function EditInvoicePage() {
  const params = useParams()
  const { data, isLoading } = useInvoice(params.id as string)

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Invoice</h1>
        <p className="text-gray-500 mt-1">
          Update invoice details
        </p>
      </div>

      <InvoiceForm invoice={data?.invoice} />
    </div>
  )
}
