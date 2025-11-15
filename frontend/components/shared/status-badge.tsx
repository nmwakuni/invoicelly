// components/shared/status-badge.tsx
import { Badge } from '@/components/ui/badge'
import { InvoiceStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: InvoiceStatus
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: any }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  viewed: { label: 'Viewed', variant: 'outline' },
  paid: { label: 'Paid', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
