// components/clients/client-card.tsx
import Link from 'next/link'
import { Client } from '@/lib/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mail, Phone, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useDeleteClient } from '@/lib/hooks/use-clients'

interface ClientCardProps {
  client: Client
}

export function ClientCard({ client }: ClientCardProps) {
  const deleteClient = useDeleteClient()

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      deleteClient.mutate(client.id)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {client.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/clients/${client.id}`}
              className="font-semibold hover:text-blue-600 transition-colors"
            >
              {client.name}
            </Link>
            {client.company && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building className="h-3 w-3" />
                {client.company}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/clients/${client.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-2">
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <a
              href={`mailto:${client.email}`}
              className="hover:text-blue-600 truncate"
            >
              {client.email}
            </a>
          </div>
        )}

        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <a href={`tel:${client.phone}`} className="hover:text-blue-600">
              {client.phone}
            </a>
          </div>
        )}

        {(client.city || client.country) && (
          <div className="text-sm text-gray-600">
            {[client.city, client.country].filter(Boolean).join(', ')}
          </div>
        )}

        <div className="pt-3">
          <Link href={`/invoices/new?clientId=${client.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              Create Invoice
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
