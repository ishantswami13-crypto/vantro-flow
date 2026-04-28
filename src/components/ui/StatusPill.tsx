import { Badge } from './Badge'

type StatusVariant = 'paid' | 'pending' | 'overdue' | 'partial'

const STATUS_CONFIG: Record<StatusVariant, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid:    { label: 'Paid',    variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'danger' },
  partial: { label: 'Partial', variant: 'default' },
}

export function StatusPill({ status }: { status: StatusVariant }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant} size="sm" dot>{config.label}</Badge>
}
