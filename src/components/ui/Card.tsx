import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'accent'
  padding?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  default:
    'bg-[var(--surface-0)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]',
  elevated:
    'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
  accent:
    'bg-gradient-to-br from-[var(--brand-primary-soft)] to-[var(--surface-0)] border border-[var(--border-default)] shadow-[var(--shadow-sm)]',
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variantStyles[variant],
        paddingStyles[padding],
        interactive && 'cursor-pointer transition-shadow hover:shadow-[var(--shadow-sm)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
