import { Client } from '@/lib/types'
import { ClientCard } from './client-card'

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  )
}
