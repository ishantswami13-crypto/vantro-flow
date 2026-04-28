import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: LucideIcon
  iconRight?: LucideIcon
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--brand-primary)] text-white border-transparent hover:bg-[var(--brand-primary-hover)] shadow-[0_2px_8px_var(--brand-glow)]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]',
  ghost:
    'bg-transparent text-[var(--text-tertiary)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-soft)] hover:bg-[var(--danger)] hover:text-white',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'magnetic inline-flex items-center justify-center rounded-full border font-semibold',
        'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
      {children}
      {!loading && IconRight ? <IconRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </button>
  )
}
