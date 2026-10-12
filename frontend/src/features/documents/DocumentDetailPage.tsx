import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  documentsApi,
  documentVersionsApi,
  consultantReviewsApi,
  contractsApi,
  usersApi,
} from '@/api'
import { useUserStore, useUIStore } from '@/stores'
import { DocumentStatuses, ConsultantReview } from '@/types'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RatingBadge } from '@/components/common/RatingBadge'
import { CopyButton } from '@/components/common/CopyButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatDateTime, formatBytes } from '@/lib/utils'
import { useTranslation } from '@/i18n/useTranslation'
import {
  FileText,
  Download,
  Layers,
  ArrowUpCircle,
  CheckSquare,
  Clock,
  ArrowLeft,
  FileCheck2,
  ShieldAlert,
  SearchX,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Compass,
  HardHat,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCodingOrder } from '@/hooks/useCodingOrder'
import { DEFAULT_CODING_ORDER } from '@/types/coding'

/** أنماط وتأثيرات أكواد الفيدك الاستشارية (FIDIC Log Codes) */
const LOG_CODE_STYLE: Record<
  string,
  { label: string; bg: string; text: string; border: string; glow: string; hint: string }
> = {
  UR: {
    label: 'UR',
    bg: 'bg-sky-500',
    text: 'text-white',
    border: 'border-sky-400',
    glow: 'shadow-sky-500/30',
    hint: 'Under Review',
  },
  A: {
    label: 'A',
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: 'border-emerald-400',
    glow: 'shadow-emerald-500/30',
    hint: 'Approved Without Comments',
  },
  B: {
    label: 'B',
    bg: 'bg-teal-500',
    text: 'text-white',
    border: 'border-teal-400',
    glow: 'shadow-teal-500/30',
    hint: 'Approved As Noted',
  },
  C: {
    label: 'C',
    bg: 'bg-amber-500',
    text: 'text-white',
    border: 'border-amber-400',
    glow: 'shadow-amber-500/30',
    hint: 'Revise & Resubmit',
  },
  D: {
    label: 'D',
    bg: 'bg-rose-600',
    text: 'text-white',
    border: 'border-rose-400',
    glow: 'shadow-rose-500/30',
    hint: 'Rejected',
  },
}

function statusToCode(status?: string): string {
  switch (status) {
    case 'Approved':
      return 'A'
    case 'ApprovedWithComments':
      return 'B'
    case 'RequiresRevision':
      return 'C'
    case 'Rejected':
      return 'D'
    default:
      return 'UR'
  }
}

/** حساب التأخير ومواعيد الاستحقاق (SLA Overdue) */
function computeOverdue(dueDate?: string | null, status?: string) {
  if (!dueDate) return { overdue: false, days: 0 }
  const open =
    status === 'PendingReview' ||
    status === 'RequiresRevision' ||
    !status
  if (!open) return { overdue: false, days: 0 }

  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return { overdue: false, days: 0 }

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (today <= dueDay) return { overdue: false, days: 0 }
  const days = Math.round((today.getTime() - dueDay.getTime()) / 86400000)
  return { overdue: true, days }
}

export const DocumentDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const docId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const { currentUser, isEngineer, isConsultant, isSuperAdmin } = useUserStore()
  const { openReview } = useUIStore()
  const isAdmin = isSuperAdmin()

  // جلب تفاصيل المستند
  const {
    data: document,
    isLoading: docLoading,
    error: docError,
  } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => documentsApi.getById(docId),
    enabled: !!docId,
    retry: false,
  })

  // جلب إصدارات المستند
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['document-versions', docId],
    queryFn: () => documentVersionsApi.getByDocument(docId),
    enabled: !!docId,
  })

  // جلب بيانات العقد المرتبط
  const { data: contract } = useQuery({
    queryKey: ['contract', document?.contractId],
    queryFn: () => (document ? contractsApi.getById(document.contractId) : null),
    enabled: !!document,
  })

  // دليل المستخدمين لحساب الأسماء (للأدمن)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    enabled: isAdmin,
  })

  // جلب مراجعات الاستشاري لكل إصدار
  const versionIds = versions.map((v) => v.versionId).join(',')
  const { data: reviewsByVersion = {} } = useQuery({
    queryKey: ['consultant-reviews', 'by-version', docId, versionIds],
    queryFn: async () => {
      const results: Record<number, ConsultantReview[]> = {}
      await Promise.all(
        versions.map(async (v) => {
          results[v.versionId] = await consultantReviewsApi.getByVersion(v.versionId)
        })
      )
      return results
    },
    enabled: !!docId && versions.length > 0,
  })

  // تسلسل الترقيم الديناميكي للمستند
  const { data: codingOrder } = useCodingOrder()

  if (docLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="h-28 rounded-3xl bg-white p-6 shadow-sm dark:bg-[#151c28]">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="mt-3 h-8 w-80 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  const errStatus = (docError as { response?: { status?: number } } | null)?.response?.status

  if (errStatus === 403) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-rose-200/80 bg-white p-10 text-center shadow-lg dark:border-rose-900/40 dark:bg-[#151c28]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          Access Restricted
        </h3>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          You do not have authorization to view this submittal. It is outside your project contract scope.
        </p>
        <button
          onClick={() => navigate('/documents')}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-6 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Registry</span>
        </button>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-lg dark:border-slate-800 dark:bg-[#151c28]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <SearchX className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
          Submittal Not Found
        </h3>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          The requested document code or revision cannot be located in the central database.
        </p>
        <button
          onClick={() => navigate('/documents')}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Registry</span>
        </button>
      </div>
    )
  }

  // عرض اسم المستخدم
  const displayName = (userId?: number | null) => {
    if (userId == null) return '—'
    if (isAdmin) return users.find((u) => u.userId === userId)?.fullName || `User #${userId}`
    if (userId === currentUser?.userId) return currentUser?.fullName || '—'
    return '—'
  }

  // تفاصيل الإصدار الحالي
  const currentVersionObj =
    versions.find((v) => v.versionNumber === document.currentVersionNumber) ||
    versions[versions.length - 1]

  const canUploadRev =
    document.status === DocumentStatuses.RequiresRevision &&
    (isEngineer() || isSuperAdmin())

  const canReview =
    document.status === DocumentStatuses.PendingReview &&
    (isConsultant() || isEngineer() || isSuperAdmin())

  // تجزئة أجزاء الكود وفقاً لإعدادات الترقيم
  const order = codingOrder?.length ? codingOrder : DEFAULT_CODING_ORDER
  const codeParts = document.documentNumber.split(' / ')

  // تنزيل الملف المرفق
  const handleDownload = async (versionId: number, fileName?: string | null) => {
    try {
      toast.info('Initiating secure file download...')
      await documentVersionsApi.download(versionId, fileName || undefined)
      toast.success('Document downloaded successfully!')
    } catch {
      // Handled by global interceptor
    }
  }

  const logCode = (document.code || statusToCode(document.status) || 'UR').toUpperCase()
  const codeStyle = LOG_CODE_STYLE[logCode] || LOG_CODE_STYLE.UR
  const ov =
    document.overdue != null
      ? { overdue: !!document.overdue, days: document.daysOverdue ?? 0 }
      : computeOverdue(document.dueDate, document.status)

  return (
    <div className="space-y-7 pb-16">
      {/* =========================================================
          1. ترويسة الصفحة التنفيذية (Executive Header)
      ========================================================= */}
      <div className="rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Link
              to="/documents"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Registry</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
                <FileCheck2 className="h-4.5 w-4.5" />
              </span>

              <h1 className="font-mono text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {document.documentNumber}
              </h1>

              <CopyButton text={document.documentNumber} label="Copy Code" />

              <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1 font-mono text-xs font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                Rev {String(document.currentVersionNumber).padStart(2, '0')}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {document.title || 'Official Engineering Submittal Specification'}
            </p>
          </div>

          {/* أزرار الإجراءات والحالة */}
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={document.status} className="px-3.5 py-1.5 text-xs font-bold" />

            {canUploadRev && (
              <button
                onClick={() => navigate(`/documents/${document.documentId}/upload-version`)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-600 px-5 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition hover:bg-orange-700 active:scale-95"
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span>
                  Upload Rev{' '}
                  {(parseInt(document.currentVersionNumber, 10) + 1)
                    .toString()
                    .padStart(2, '0')}
                </span>
              </button>
            )}

            {canReview && currentVersionObj && (
              <button
                onClick={() =>
                  openReview(
                    currentVersionObj.versionId,
                    document.documentNumber,
                    currentVersionObj.versionNumber
                  )
                }
                className="inline-flex h-11 items-center gap-2 rounded-full bg-purple-600 px-6 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-700 active:scale-95"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Review & Decide</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          2. شريط تفكيك الكود الهندسي (6-Part Syntax Blueprint)
      ========================================================= */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Compass className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ISO 19650 / FIDIC Syntax Sequence
            </span>
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            {order.length} Configured Parts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 font-mono sm:grid-cols-3 lg:grid-cols-6">
          {order.map((item, index) => {
            const value =
              codeParts[index] ||
              (item.part === 'Serial' ? document.serialNumber : null) ||
              (item.part === 'Revision' ? document.currentVersionNumber : null) ||
              '—'

            const isAccent =
              item.part === 'ProjectCode'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60'
                : item.part === 'Serial'
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60'
                  : item.part === 'Revision'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/60'
                    : 'text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'

            return (
              <div
                key={item.part}
                className={`rounded-2xl border p-3 text-center transition-all ${isAccent}`}
              >
                <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {item.displayLabel}
                </span>
                <span className="mt-0.5 block truncate text-sm font-black">
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* =========================================================
          3. لوحة مواصفات المستند وسجل الاعتماد (Document Log & Sheet)
      ========================================================= */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        {/* شريط الإشارة الملون العلوي بحسب كود الفيدك */}
        <div
          className={`h-2 w-full ${
            logCode === 'A'
              ? 'bg-emerald-500'
              : logCode === 'B'
              ? 'bg-teal-500'
              : logCode === 'C'
              ? 'bg-amber-500'
              : logCode === 'D'
              ? 'bg-rose-600'
              : 'bg-sky-500'
          }`}
        />

        {/* رأس البطاقة والشارة الاستشارية الكبرى */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Technical Office Log Sheet
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Detailed submittal specification, site coordinates & dispatch matrix
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* الشارة الاستشارية الكبرى FIDIC Code */}
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-lg ${codeStyle.bg} ${codeStyle.text} ${codeStyle.border} ${codeStyle.glow}`}
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                  FIDIC
                </span>
                <span className="font-mono text-2xl font-black leading-none">
                  {codeStyle.label}
                </span>
              </div>
              <div className="border-s border-white/30 ps-3 text-xs font-extrabold">
                {codeStyle.hint}
              </div>
            </div>

            {/* حالة الإغلاق أو الـ Overdue */}
            {document.status === 'Rejected' || logCode === 'D' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4" />
                <span>Closed · Rejected</span>
              </span>
            ) : document.status === 'Approved' ||
              document.status === 'ApprovedWithComments' ||
              logCode === 'A' ||
              logCode === 'B' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Closed · Approved</span>
              </span>
            ) : ov.overdue ? (
              <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30">
                <Clock className="h-4 w-4" />
                <span>OVERDUE · {ov.days} day{ov.days === 1 ? '' : 's'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>On Schedule</span>
              </span>
            )}
          </div>
        </div>

        {/* شبكة البيانات الهندسية الشاملة */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(
              [
                ['Master Project', contract?.projectName || (contract ? `Project #${contract.projectId}` : '—')],
                ['Contract Code', contract?.contractCode || '—'],
                ['Contract Name', contract?.contractName || '—'],
                ['Document Code', document.documentNumber],
                ['Revision No', `Rev ${document.currentVersionNumber}`],
                ['Workflow Status', document.status],
                ['Inspection Ref', document.inspectionRef || '—'],
                ['Zone Area', document.zone || '—'],
                ['Building / Level', document.building || '—'],
                ['Grid / Axis', document.axis || '—'],
                ['Issue Date', document.issueDate ? formatDate(document.issueDate) : '—'],
                ['Inspection Date', document.inspectionDate ? formatDate(document.inspectionDate) : '—'],
                ['Due Target Date', document.dueDate ? formatDate(document.dueDate) : '—'],
                ['Consultant Reply Date', document.replyDate ? formatDate(document.replyDate) : '—'],
                [
                  'Issued By',
                  document.issuedByUserId
                    ? displayName(document.issuedByUserId)
                    : displayName(document.createdByUserId),
                ],
                [
                  'Document Controller',
                  document.documentControllerUserId
                    ? displayName(document.documentControllerUserId)
                    : '—',
                ],
                ['Created By', displayName(document.createdByUserId)],
                ['Registered Date', formatDateTime(document.createdAt)],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {label}
                </div>
                <div className="mt-1 break-words font-sans text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* الملاحظات والشروحات (Description & Remarks) */}
          {(document.description || document.remarks) && (
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 md:grid-cols-2">
              {document.description && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Scope Description
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                    {document.description}
                  </p>
                </div>
              )}

              {document.remarks && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Technical Office Remarks
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                    {document.remarks}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          4. الخط الزمني لسجل الإصدارات والمراجعات (Revisions Timeline)
      ========================================================= */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Submittal Revision History ({versions.length})
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Audit trail of drawings, revisions, attached packages, and consultant remarks
              </p>
            </div>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {versions.length} {versions.length === 1 ? 'Revision' : 'Revisions'}
          </span>
        </div>

        <div className="p-6">
          {versionsLoading && versions.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : versions.length === 0 ? (
            <p className="py-8 text-center text-xs font-bold text-slate-400 italic">
              No previous revisions recorded for this submittal.
            </p>
          ) : (
            <div className="relative space-y-8 border-s-2 border-slate-200 ps-6 dark:border-slate-800 sm:ps-8">
              {versions
                .slice()
                .reverse()
                .map((version, idx) => {
                  const isLatest = idx === 0
                  const reviews = reviewsByVersion[version.versionId] || []

                  return (
                    <div key={version.versionId} className="relative">
                      {/* نقطة الخط الزمني الأنيقة */}
                      <span
                        className={`absolute -start-[31px] top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white sm:-start-[39px] dark:bg-[#151c28] ${
                          isLatest
                            ? 'border-blue-600 ring-4 ring-blue-50 dark:ring-blue-950'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLatest ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                        />
                      </span>

                      {/* كارت الإصدار الكامل */}
                      <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
                        {/* ترويسة الإصدار */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-xl bg-blue-100 px-3 py-1 font-mono text-xs font-black text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Revision {version.versionNumber}
                            </span>

                            {isLatest && (
                              <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                                Current
                              </span>
                            )}

                            <StatusBadge status={version.reviewStatus} />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatDateTime(version.uploadedAt)} · by{' '}
                              <strong className="text-slate-700 dark:text-slate-300">
                                {displayName(version.uploadedByUserId)}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* ملاحظات الإصدار */}
                        {version.notes && (
                          <div className="rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Revision Scope Notes:
                            </span>
                            <p className="mt-1">{version.notes}</p>
                          </div>
                        )}

                        {/* كارت الملف المرفق والتحميل */}
                        {version.fileName && (
                          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-700/80 dark:bg-slate-800/40">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="truncate text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                  {version.fileName}
                                </p>
                                <p className="font-mono text-[11px] font-bold text-slate-400">
                                  {formatBytes(version.fileSizeBytes)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownload(version.versionId, version.fileName)}
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-slate-800 shadow-sm border border-slate-200 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            >
                              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Download</span>
                            </button>
                          </div>
                        )}

                        {/* تعليقات وقرارات الاستشاري (Consultant Remarks) */}
                        <div className="border-t border-slate-100 pt-3.5 dark:border-slate-800">
                          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Consultant Decision & Verification:
                          </p>

                          {reviews.length === 0 ? (
                            document.status === 'Rejected' || version.reviewStatus === 'Rejected' ? (
                              <div className="flex items-center gap-2 rounded-xl border border-rose-200/60 bg-rose-50/70 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                <span>Closed — Rejected. No further consultant reviews required.</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
                                <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                                <span>Pending consultant technical evaluation.</span>
                              </div>
                            )
                          ) : (
                            <div className="space-y-2.5">
                              {reviews.map((rev) => (
                                <div
                                  key={rev.reviewId}
                                  className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-700/80 dark:bg-slate-800/40"
                                >
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <RatingBadge rating={rev.rating} showFullLabel />
                                    <span className="text-[11px] font-semibold text-slate-400">
                                      Reviewed by {displayName(rev.consultantUserId)} on{' '}
                                      {formatDate(rev.reviewDate)}
                                    </span>
                                  </div>

                                  {rev.comments && (
                                    <p className="border-s-2 border-blue-500 ps-2.5 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                      {rev.comments}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentDetailPage