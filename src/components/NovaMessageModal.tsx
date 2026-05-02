'use client'
import { useState } from 'react'
import { X, MessageCircle, Copy, Check } from 'lucide-react'

interface Props {
  customer: { name: string; phone: string }
  invoice: { id: number; amount: number; days_overdue: number }
  onClose: () => void
}

const TONES = [
  { key: 'soft' as const, label: 'Gentle reminder', best: 'First reminder, good relationship' },
  { key: 'firm' as const, label: 'Professional follow-up', best: '2nd or 3rd reminder' },
  { key: 'urgent' as const, label: 'Final notice', best: '30+ days overdue' },
]

export function NovaMessageModal({ customer, invoice, onClose }: Props) {
  const [messages, setMessages] = useState<{ soft: string; firm: string; urgent: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/nova/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          amount: invoice.amount,
          days_overdue: invoice.days_overdue,
          phone: customer.phone,
          invoice_id: invoice.id,
        }),
      })
      const data = await res.json() as { messages?: { soft: string; firm: string; urgent: string }; error?: string; message?: string }
      if (data.error === 'daily_limit') {
        setError(data.message ?? 'Daily limit reached. Upgrade Pro for unlimited messages.')
        return
      }
      if (data.messages) setMessages(data.messages)
    } catch {
      setError('Failed to generate messages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function openWhatsApp(text: string) {
    const phone = customer.phone.replace(/\D/g, '')
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="apple-eyebrow mb-1">Nova AI</p>
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              Message for {customer.name}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              ₹{(invoice.amount / 100000).toFixed(1)}L · {invoice.days_overdue} days overdue
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
            {error}
            <button
              type="button"
              onClick={() => window.location.assign('/settings/plan')}
              className="ml-2 underline font-medium"
            >
              Upgrade Pro
            </button>
          </div>
        )}

        {!messages && !error && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--brand-primary)' }}
          >
            <MessageCircle className="inline h-4 w-4 mr-2" />
            {loading ? 'Nova is writing...' : 'Generate Messages'}
          </button>
        )}

        {messages && (
          <div className="space-y-3">
            {TONES.map(({ key, label, best }) => (
              <div
                key={key}
                className="rounded-xl p-4"
                style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Best for: {best}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>
                  {messages[key]}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(messages[key], key)}
                    className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
                    style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}
                  >
                    {copied === key ? (
                      <><Check className="inline h-3 w-3 mr-1" />Copied!</>
                    ) : (
                      <><Copy className="inline h-3 w-3 mr-1" />Copy</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(messages[key])}
                    className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white transition-colors"
                    style={{ background: '#25D366' }}
                  >
                    Open WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          Powered by Nova · Review before sending
        </p>
      </div>
    </div>
  )
}
