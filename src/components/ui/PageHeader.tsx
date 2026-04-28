import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  serif?: boolean
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
  serif = true,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="apple-eyebrow mb-2">{eyebrow}</p>
        )}
        <h1
          className={cn(
            'text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl',
            serif && 'serif'
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
