import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export default function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-6 py-12 text-center',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      {eyebrow && <p className="apple-eyebrow mb-2">{eyebrow}</p>}
      <h3 className="serif text-xl font-normal text-[var(--text-primary)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-tertiary)]">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
