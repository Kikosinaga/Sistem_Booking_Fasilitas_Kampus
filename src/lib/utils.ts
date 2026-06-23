import { type ClassValue } from 'clsx'

// Simple cn utility without clsx dependency
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Format currency to IDR
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date to Indonesian locale
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  })
}

// Format time
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format date and time
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

// Format relative time (e.g., "2 jam lalu")
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`
  return formatDate(date)
}

// Calculate booking duration in hours
export function calculateDuration(startTime: Date | string, endTime: Date | string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

// Calculate booking price
export function calculatePrice(
  pricePerHour: number,
  startTime: Date | string,
  endTime: Date | string,
  isFree: boolean = false
): number {
  if (isFree) return 0
  const hours = calculateDuration(startTime, endTime)
  return Math.ceil(hours) * pricePerHour
}

// Generate slug from string
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Check if two date ranges overlap (for conflict detection)
export function isTimeConflict(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = new Date(start1).getTime()
  const e1 = new Date(end1).getTime()
  const s2 = new Date(start2).getTime()
  const e2 = new Date(end2).getTime()
  return s1 < e2 && s2 < e1
}

// Get booking status label in Indonesian
export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Menunggu Persetujuan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    PAID: 'Sudah Dibayar',
    ACTIVE: 'Sedang Berlangsung',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  }
  return labels[status] || status
}

// Get booking status color
export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'info',
    REJECTED: 'danger',
    PAID: 'success',
    ACTIVE: 'primary',
    COMPLETED: 'neutral',
    CANCELLED: 'danger',
  }
  return colors[status] || 'neutral'
}

// Get payment status label
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: 'Belum Dibayar',
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Lunas',
    FAILED: 'Gagal',
    REFUNDED: 'Dikembalikan',
  }
  return labels[status] || status
}

// Get role label
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrator',
    MAHASISWA: 'Mahasiswa',
    DOSEN: 'Dosen',
    EKSTERNAL: 'Eksternal',
  }
  return labels[role] || role
}

// Facility type label
export function getFacilityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    AULA: 'Aula',
    GEDUNG: 'Gedung',
    LAPANGAN: 'Lapangan',
    GOR: 'Gelanggang Olahraga',
  }
  return labels[type] || type
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Delay utility for animations
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
