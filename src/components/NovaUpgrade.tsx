'use client'
import { getUpgradePrompt, type Plan } from '@/lib/nova-plans'
import { useRouter } from 'next/navigation'

type FeatureKey = Parameters<typeof getUpgradePrompt>[0]

interface NovaUpgradeProps {
  feature: FeatureKey
  plan: Plan
  variant?: 'banner' | 'card' | 'inline'
  children?: React.ReactNode
}

export function NovaUpgrade({ feature, variant = 'card', children }: NovaUpgradeProps) {
  const router = useRouter()
  const prompt = getUpgradePrompt(feature)

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={() => router.push('/settings/plan')}
        className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 transition-colors"
        style={{
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-default)',
        }}
      >
        <span>🔒</span>
        <span>{prompt.cta}</span>
      </button>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className="w-full rounded-xl p-4 flex items-center justify-between gap-4 mb-6"
        style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {prompt.headline}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {prompt.detail}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/settings/plan')}
          className="shrink-0 text-xs font-medium px-4 py-2 rounded-lg transition-colors text-white whitespace-nowrap"
          style={{ background: 'var(--warning)' }}
        >
          {prompt.cta}
        </button>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
      <div className="pointer-events-none select-none opacity-30 p-6" style={{ filter: 'blur(4px)' }}>
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      >
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
          {prompt.headline}
        </h3>
        <p className="text-sm mb-4 max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
          {prompt.detail}
        </p>
        <button
          type="button"
          onClick={() => router.push('/settings/plan')}
          className="text-sm font-medium px-6 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand-primary)' }}
        >
          {prompt.cta}
        </button>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          No setup fee. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
