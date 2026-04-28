import { cn } from '@/lib/utils'
import { formatCompact, formatINR } from '@/lib/format'

interface MoneyValueProps {
  value: number
  compact?: boolean
  color?: 'default' | 'positive' | 'negative'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const colorStyles: Record<NonNullable<MoneyValueProps['color']>, string> = {
  default:  'text-[var(--text-primary)]',
  positive: 'text-[var(--success)]',
  negative: 'text-[var(--danger)]',
}

const sizeStyles: Record<NonNullable<MoneyValueProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
}

export function MoneyValue({
  value,
  compact = false,
  color = 'default',
  size = 'md',
  className,
}: MoneyValueProps) {
  const formatted = compact ? formatCompact(value) : formatINR(value)
  return (
    <span
      className={cn('tabular font-semibold serif', colorStyles[color], sizeStyles[size], className)}
    >
      {formatted}
    </span>
  )
}
