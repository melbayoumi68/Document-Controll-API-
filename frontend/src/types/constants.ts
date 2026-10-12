export const Roles = {
  SuperAdmin: 'SUPER_ADMIN',
  ToEngineer: 'Technical ENGINEER',
  Consultant: 'CONSULTANT',
} as const

export type RoleType = (typeof Roles)[keyof typeof Roles]

export const DocumentStatuses = {
  PendingReview: 'PendingReview',
  Approved: 'Approved',
  ApprovedWithComments: 'ApprovedWithComments',
  RequiresRevision: 'RequiresRevision',
  Rejected: 'Rejected',
} as const

export type DocumentStatusType = (typeof DocumentStatuses)[keyof typeof DocumentStatuses]

export const Ratings = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const

export type RatingType = (typeof Ratings)[keyof typeof Ratings]

export const RatingInfo: Record<
  RatingType,
  { label: string; meaning: string; color: string; badgeClass: string; isFinal: boolean }
> = {
  A: {
    label: 'Rating A - Approved',
    meaning: 'Approved without remarks. Final status.',
    color: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    isFinal: true,
  },
  B: {
    label: 'Rating B - Approved with Comments',
    meaning: 'Approved with minor comments. Final status (no new submittal needed).',
    color: '#3b82f6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    isFinal: true,
  },
  C: {
    label: 'Rating C - Requires Revision',
    meaning: 'Revise & Resubmit. Allows engineer to upload Version 02+.',
    color: '#f97316',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    isFinal: false,
  },
  D: {
    label: 'Rating D - Rejected',
    meaning: 'Rejected. Final status (requires a completely new document).',
    color: '#ef4444',
    badgeClass: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    isFinal: true,
  },
}

export const StatusInfo: Record<
  DocumentStatusType,
  { label: string; color: string; badgeClass: string; dotClass: string }
> = {
  PendingReview: {
    label: 'Pending Review',
    color: '#f59e0b',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  Approved: {
    label: 'A',
    color: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  ApprovedWithComments: {
    label: 'B',
    color: '#3b82f6',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    dotClass: 'bg-blue-500',
  },
  RequiresRevision: {
    label: 'C',
    color: '#f97316',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    dotClass: 'bg-orange-500',
  },
  Rejected: {
    label: 'D',
    color: '#ef4444',
    badgeClass: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    dotClass: 'bg-red-500',
  },
}

export const MaxFileSize = 25 * 1024 * 1024 // 25 MB
export const AllowedFileExtensions = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.dwg',
  '.dxf',
  '.jpg',
  '.jpeg',
  '.png',
  '.zip',
  '.rar',
  '.txt',
]
