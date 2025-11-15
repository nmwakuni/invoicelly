// app/(dashboard)/clients/new/page.tsx
'use client'

import { ClientForm } from '@/components/clients/client-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Client</h1>
        <p className="text-gray-500 mt-1">
          Create a new client profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  )
}
