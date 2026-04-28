import { cn } from '@/lib/utils'

type RiskLevel = 'low' | 'medium' | 'high'

const RISK_CONFIG: Record<RiskLevel, { label: string; dot: string; text: string }> = {
  low:    { label: 'Low risk',    dot: 'bg-[var(--success)]', text: 'text-[var(--success)]' },
  medium: { label: 'Medium risk', dot: 'bg-[var(--warning)]', text: 'text-[var(--warning)]' },
  high:   { label: 'High risk',   dot: 'bg-[var(--danger)]',  text: 'text-[var(--danger)]'  },
}

export function RiskScore({
  level,
  label,
  className,
}: {
  level: RiskLevel
  label?: string
  className?: string
}) {
  const config = RISK_CONFIG[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', config.text, className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {label ?? config.label}
    </span>
  )
}
