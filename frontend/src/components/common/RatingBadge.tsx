import React from 'react'
import { RatingType, RatingInfo } from '@/types'
import { cn } from '@/lib/utils'

export interface RatingBadgeProps {
  rating: RatingType | string
  className?: string
  showFullLabel?: boolean
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  className,
  showFullLabel = false,
}) => {
  const info = RatingInfo[rating as RatingType]

  if (!info) {
    return (
      <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 text-slate-700">
        {rating}
      </span>
    )
  }

  return (
    <span
      title={info.meaning}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border tracking-wide transition-all shadow-2xs',
        info.badgeClass,
        className
      )}
    >
      <span className="font-mono font-black text-sm">{rating}</span>
      {showFullLabel && <span className="font-medium">{info.label.split(' - ')[1]}</span>}
    </span>
  )
}
