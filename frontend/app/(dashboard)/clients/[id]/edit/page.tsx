// app/(dashboard)/clients/[id]/edit/page.tsx
'use client'

import { useClient } from '@/lib/hooks/use-clients'
import { ClientForm } from '@/components/clients/client-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useParams } from 'next/navigation'

export default function EditClientPage() {
  const params = useParams()
  const { data, isLoading } = useClient(params.id as string)

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Client</h1>
        <p className="text-gray-500 mt-1">
          Update client information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm client={data?.client} />
        </CardContent>
      </Card>
    </div>
  )
}
