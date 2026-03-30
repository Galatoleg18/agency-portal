import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    on_hold: 'bg-amber-100 text-amber-700',
    completed: 'bg-sky-100 text-sky-700',
    cancelled: 'bg-red-100 text-red-600',
    archived: 'bg-gray-100 text-gray-500',
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-amber-100 text-amber-700',
    overdue: 'bg-red-100 text-red-600',
    pending: 'bg-gray-100 text-gray-500',
    in_progress: 'bg-sky-100 text-sky-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-600',
    revision_requested: 'bg-orange-100 text-orange-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

export function statusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
