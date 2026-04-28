import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
  children: React.ReactNode
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, { pill: string; dot: string }> = {
  default: {
    pill: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
    dot: 'bg-[var(--text-muted)]',
  },
  success: {
    pill: 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-soft)]',
    dot: 'bg-[var(--success)]',
  },
  warning: {
    pill: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-soft)]',
    dot: 'bg-[var(--warning)]',
  },
  danger: {
    pill: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-soft)]',
    dot: 'bg-[var(--danger)]',
  },
  info: {
    pill: 'bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-soft)]',
    dot: 'bg-[var(--info)]',
  },
  brand: {
    pill: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary-soft)]',
    dot: 'bg-[var(--brand-primary)]',
  },
}

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export function Badge({ variant = 'default', size = 'sm', dot, className, children }: BadgeProps) {
  const styles = variantStyles[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        styles.pill,
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />}
      {children}
    </span>
  )
}
