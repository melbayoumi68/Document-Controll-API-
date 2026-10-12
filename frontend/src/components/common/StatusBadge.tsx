import React from 'react'
import { DocumentStatusType, StatusInfo } from '@/types'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, MessageSquare, AlertCircle, XCircle } from 'lucide-react'

export interface StatusBadgeProps {
  status: DocumentStatusType | string
  className?: string
  showIcon?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const info = StatusInfo[status as DocumentStatusType] || {
    label: status,
    color: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  }

  const getIcon = () => {
    switch (status) {
      case 'PendingReview':
        return <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
      case 'Appraoved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      case 'ApprovedWithComments':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      case 'RequiresRevision':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
      case 'Rejected':
        return <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
      default:
        return <span className={cn('w-2 h-2 rounded-full', info.dotClass)} />
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all',
        info.badgeClass,
        className
      )}
    >
      {showIcon && getIcon()}
      <span>{info.label}</span>
    </span>
  )
}
