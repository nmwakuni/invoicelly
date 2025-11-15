// app/(dashboard)/clients/page.tsx
'use client'

import { useState } from 'react'
import { useClients } from '@/lib/hooks/use-clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { ClientCard } from '@/components/clients/client-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Users } from 'lucide-react'

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: clients, isLoading } = useClients()

  const filteredClients = clients?.filter((client) => {
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.company?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-500 mt-1">
            Manage your clients and their information
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start creating invoices"
          action={{
            label: 'Add Client',
            onClick: () => (window.location.href = '/clients/new'),
          }}
        />
      ) : filteredClients && filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No clients found matching your search</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients?.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
