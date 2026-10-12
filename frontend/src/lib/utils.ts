import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(d, 'MMM dd, yyyy')
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(d, 'MMM dd, yyyy HH:mm')
  } catch {
    return dateString
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return dateString
  }
}

export function formatBytes(bytes?: number | null, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
