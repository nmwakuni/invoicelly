// components/analytics/top-clients.tsx
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/utils'

interface TopClientsProps {
  clients: Array<{
    id: string
    name: string
    company?: string
    invoiceCount: number
    totalPaid: number
    outstanding: number
  }>
}

export function TopClients({ clients }: TopClientsProps) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No client data yet
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {clients.slice(0, 5).map((client) => (
        <Link
          key={client.id}
          href={`/clients/${client.id}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {client.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{client.name}</p>
              {client.company && (
                <p className="text-xs text-gray-500">{client.company}</p>
              )}
              <p className="text-xs text-gray-500">
                {client.invoiceCount} invoices
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-sm">
              {formatCurrency(client.totalPaid)}
            </p>
            {client.outstanding > 0 && (
              <p className="text-xs text-orange-500">
                {formatCurrency(client.outstanding)} outstanding
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
