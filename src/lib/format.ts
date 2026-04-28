export const formatINR = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0)

export const formatCompact = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(1) + 'Cr'
  if (abs >= 100_000)    return '₹' + (n / 100_000).toFixed(1) + 'L'
  if (abs >= 1_000)      return '₹' + (n / 1_000).toFixed(1) + 'K'
  return formatINR(n)
}

export const formatRelativeDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export const getRiskLevel = (
  daysOverdue: number,
  outstanding = 0
): 'safe' | 'watchlist' | 'high' | 'overdue' | 'critical' => {
  if (daysOverdue >= 75 || outstanding >= 500_000) return 'critical'
  if (daysOverdue >= 45) return 'overdue'
  if (daysOverdue >= 21) return 'high'
  if (daysOverdue > 0 || outstanding > 0) return 'watchlist'
  return 'safe'
}
