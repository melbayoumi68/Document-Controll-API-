import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  documentsApi,
  contractsApi,
  usersApi,
  consultantReviewsApi,
  documentVersionsApi,
} from '@/api'
import { useUserStore, useUIStore } from '@/stores'
import { Document, DocumentStatuses } from '@/types'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CopyButton } from '@/components/common/CopyButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/i18n/useTranslation'
import {
  Search,
  PlusCircle,
  CheckSquare,
  ArrowUpCircle,
  FileText,
  Layers,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  RotateCcw,
} from 'lucide-react'

export const DocumentsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser, isEngineer, isConsultant, isSuperAdmin } = useUserStore()
  const { openReview } = useUIStore()
  const { t } = useTranslation()
  const isAdmin = isSuperAdmin()

  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get('status') || 'ALL'
  )
  const [selectedContract, setSelectedContract] = useState<string>(
    searchParams.get('contractId') || 'ALL'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [resolvingDocId, setResolvingDocId] = useState<number | null>(null)

  const contractParam = searchParams.get('contractId')
  useEffect(() => {
    setSelectedContract(contractParam || 'ALL')
    setPage(1)
  }, [contractParam])

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', isAdmin ? 'all' : 'mine', currentUser?.userId],
    queryFn: () => (isAdmin ? documentsApi.getAll() : documentsApi.getMyDocuments()),
    enabled: !!currentUser,
  })

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', isAdmin ? 'all' : 'mine', currentUser?.userId],
    queryFn: () => (isAdmin ? contractsApi.getAll() : contractsApi.getMine()),
    enabled: !!currentUser,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    enabled: isAdmin,
  })

  const { data: allVersions = [] } = useQuery({
    queryKey: ['document-versions-all'],
    queryFn: () => documentVersionsApi.getAll(),
    enabled: isAdmin,
  })

  const { data: allReviews = [] } = useQuery({
    queryKey: ['consultant-reviews'],
    queryFn: () => consultantReviewsApi.getAll(),
    enabled: isAdmin,
  })

  const contractById = useMemo(() => {
    const map = new Map<number, (typeof contracts)[0]>()
    for (const c of contracts) map.set(c.contractId, c)
    return map
  }, [contracts])

  const userById = useMemo(() => {
    const map = new Map<number, (typeof users)[0]>()
    for (const u of users) map.set(u.userId, u)
    return map
  }, [users])

  // حساب مؤشرات سريعة
  const stats = useMemo(() => {
    const total = documents.length
    const pending = documents.filter((d) => d.status === DocumentStatuses.PendingReview).length
    const revisions = documents.filter((d) => d.status === DocumentStatuses.RequiresRevision).length
    const approved = documents.filter(
      (d) =>
        d.status === DocumentStatuses.Approved ||
        d.status === DocumentStatuses.ApprovedWithComments
    ).length
    const rejected = documents.filter((d) => d.status === DocumentStatuses.Rejected).length

    return { total, pending, revisions, approved, rejected }
  }, [documents])

  const statusOptions: { id: string; label: string; count?: number }[] = [
    { id: 'ALL', label: 'All Registry', count: stats.total },
    {
      id: DocumentStatuses.PendingReview,
      label: 'Pending Review',
      count: stats.pending,
    },
    {
      id: DocumentStatuses.RequiresRevision,
      label: 'Requires Revision (Code C)',
      count: stats.revisions,
    },
    {
      id: DocumentStatuses.Approved,
      label: 'Approved (Code A & B)',
      count: stats.approved,
    },
    {
      id: DocumentStatuses.Rejected,
      label: 'Rejected (Code D)',
      count: stats.rejected,
    },
  ]

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // فلترة الحالة
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === DocumentStatuses.Approved) {
          if (
            doc.status !== DocumentStatuses.Approved &&
            doc.status !== DocumentStatuses.ApprovedWithComments
          ) {
            return false
          }
        } else if (doc.status !== selectedStatus) {
          return false
        }
      }

      // فلترة العقد
      if (selectedContract !== 'ALL' && doc.contractId !== parseInt(selectedContract, 10)) {
        return false
      }

      // البحث
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const contract = contractById.get(doc.contractId)
        const matchNumber = doc.documentNumber.toLowerCase().includes(q)
        const matchTitle = doc.title?.toLowerCase().includes(q)
        const matchDesc = doc.description?.toLowerCase().includes(q)
        const matchContract =
          contract?.contractName?.toLowerCase().includes(q) ||
          contract?.contractCode?.toLowerCase().includes(q)
        const matchProject = contract?.projectName?.toLowerCase().includes(q)

        let matchesUsers = false
        if (isAdmin) {
          const engineer = userById.get(doc.createdByUserId)
          matchesUsers = engineer?.fullName?.toLowerCase().includes(q) || false
        }

        if (
          !matchNumber &&
          !matchTitle &&
          !matchDesc &&
          !matchContract &&
          !matchProject &&
          !matchesUsers
        ) {
          return false
        }
      }

      return true
    })
  }, [
    documents,
    selectedStatus,
    selectedContract,
    searchQuery,
    isAdmin,
    contractById,
    userById,
  ])

  useEffect(() => {
    setPage(1)
  }, [selectedStatus, searchQuery, selectedContract, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedDocuments = filteredDocuments.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  // تجميع المستندات تحت كل مشروع هندسي (Grouped By Master Project)
  const groupedByProject = useMemo(() => {
    interface ProjectGroup {
      projectId: number
      projectName: string
      projectCode: string
      docs: Document[]
    }

    const map = new Map<number, ProjectGroup>()

    for (const doc of pagedDocuments) {
      const contract = contractById.get(doc.contractId)
      const pId = contract?.projectId ?? 0
      const pName = contract?.projectName || (pId ? `Project #${pId}` : 'General Project Scope')
      const pCode = pName.split(' ')[0] || `PRJ-${pId}`

      if (!map.has(pId)) {
        map.set(pId, {
          projectId: pId,
          projectName: pName,
          projectCode: pCode,
          docs: [],
        })
      }

      map.get(pId)!.docs.push(doc)
    }

    return Array.from(map.values())
  }, [pagedDocuments, contractById])

  // تغيير الفلتر بدون عمل Page Refresh أو إضافة صفحات للـ History
  const handleStatusChange = (statusId: string) => {
    setSelectedStatus(statusId)
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)
    if (statusId === 'ALL') {
      nextParams.delete('status')
    } else {
      nextParams.set('status', statusId)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleReview = async (doc: Document) => {
    setResolvingDocId(doc.documentId)
    try {
      const versions = await documentVersionsApi.getByDocument(doc.documentId)
      const current =
        versions.find((v) => v.versionNumber === doc.currentVersionNumber) ||
        versions.reduce((max, v) => (v.versionId > max.versionId ? v : max), versions[0])
      if (current) {
        openReview(current.versionId, doc.documentNumber, current.versionNumber)
      }
    } finally {
      setResolvingDocId(null)
    }
  }

  return (
    <div className="space-y-7 pb-16">
      {/* =========================================================
          1. ترويسة الصفحة
      ========================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {isAdmin ? 'Technical Office Registry' : t('myDocuments')}
            </h1>
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Master engineering submittals, shop drawings, RFIs, and consultant review decisions grouped by project.
          </p>
        </div>

        {(isEngineer() || isAdmin) && (
          <button
            onClick={() => navigate('/documents/submit')}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit New Document</span>
          </button>
        )}
      </div>

      {/* =========================================================
          2. شريط مؤشرات سريعة
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Submittals
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending Review
              </p>
              <h3 className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.pending}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Requires Revision
              </p>
              <h3 className="mt-1 text-2xl font-black text-orange-600 dark:text-orange-400">
                {stats.revisions}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Approved & Closed
              </p>
              <h3 className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.approved}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. أزرار الفلترة الكبسولية والشريط المزدوج
      ========================================================= */}
      <div className="space-y-3.5">
        {/* أزرار الحالات الكبسولية للفلترة السريعة المباشرة */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleStatusChange(opt.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'border border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#151c28] dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* شريط البحث المزدوج واختيار العقد */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder={
                isAdmin
                  ? 'Search by submittal code, title, contract, or engineer...'
                  : 'Search by submittal code, title, contract...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/70 ps-10 pe-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">📁 All Contracts ({contracts.length})</option>
              {contracts.map((c) => (
                <option key={c.contractId} value={c.contractId}>
                  {c.contractCode} - {c.contractName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. قائمة المستندات المنظمة حسب المشاريع (PROJECT HUBS)
      ========================================================= */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          /* =========================================================
              علاج الـ Not Found: إظهار بطاقة نظيفة بدون أي أخطاء
          ========================================================= */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-14 px-6 text-center shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              No Submittals for Selected Filter
            </h3>

            <p className="mt-1 text-xs text-slate-400 max-w-md">
              There are currently 0 documents with status{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                "{statusOptions.find((o) => o.id === selectedStatus)?.label || selectedStatus}"
              </strong>{' '}
              in your active project scope.
            </p>

            <button
              type="button"
              onClick={() => {
                handleStatusChange('ALL')
                setSelectedContract('ALL')
                setSearchQuery('')
              }}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Show All Documents</span>
            </button>
          </div>
        ) : (
          groupedByProject.map((group) => {
            const projectDocsCount = group.docs.length

            return (
              <div
                key={group.projectId}
                className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]"
              >
                {/* رأس كارت المشروع الماستر */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {group.projectName}
                      </h2>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        Master Construction & Engineering Package Registry
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-xs font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {projectDocsCount} {projectDocsCount === 1 ? 'Submittal' : 'Submittals'}
                  </span>
                </div>

                {/* قائمة المستندات التابعة للمشروع */}
                <div className="divide-y divide-slate-100 p-3 sm:p-4 dark:divide-slate-800">
                  {group.docs.map((doc) => {
                    const isPending = doc.status === DocumentStatuses.PendingReview
                    const canUploadRev =
                      doc.status === DocumentStatuses.RequiresRevision &&
                      (isEngineer() || isAdmin)
                    const canReview = isPending && (isConsultant() || isEngineer() || isAdmin)

                    const contract = contractById.get(doc.contractId)
                    const engineer = userById.get(doc.createdByUserId)
                    const engineerName =
                      engineer?.fullName ||
                      (doc.createdByUserId === currentUser?.userId
                        ? currentUser?.fullName || '—'
                        : isAdmin
                          ? `User #${doc.createdByUserId}`
                          : '—')

                    return (
                      <div
                        key={doc.documentId}
                        className="group flex flex-col justify-between gap-4 rounded-2xl p-4 transition-all duration-200 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 lg:flex-row lg:items-center"
                      >
                        {/* الجزء الأيسر: كود الترقيم، الإصدار، العنوان، حزمة العقد */}
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-1 font-mono text-xs font-black text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
                              <Link
                                to={`/documents/${doc.documentId}`}
                                className="tracking-tight hover:underline"
                              >
                                {doc.documentNumber}
                              </Link>
                              <CopyButton text={doc.documentNumber} label="Copy" />
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <Layers className="h-3 w-3 text-blue-500" />
                              Rev {String(doc.currentVersionNumber).padStart(2, '0')}
                            </span>

                            <StatusBadge status={doc.status} />

                            {contract && (
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                📦 {contract.contractCode}
                              </span>
                            )}
                          </div>

                          <div>
                            <Link
                              to={`/documents/${doc.documentId}`}
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400"
                            >
                              <span>{doc.title || 'Untitled Engineering Drawing'}</span>
                              <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                            </Link>

                            {doc.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* الجزء الأوسط: المهندس والتاريخ */}
                        <div className="flex flex-wrap items-center gap-6 text-xs lg:px-6">
                          {isAdmin && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Submitter
                              </span>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">
                                {engineerName}
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Submitted Date
                            </span>
                            <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {formatDate(doc.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* الجزء الأيمن: أزرار الإجراءات السريعة */}
                        <div className="flex shrink-0 items-center gap-2">
                          {canReview && (
                            <button
                              disabled={resolvingDocId === doc.documentId}
                              onClick={() => handleReview(doc)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-purple-600 px-4 text-xs font-bold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-700 active:scale-95 disabled:opacity-60"
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                              <span>
                                {resolvingDocId === doc.documentId ? 'Opening...' : 'Review & Rate'}
                              </span>
                            </button>
                          )}

                          {canUploadRev && (
                            <button
                              onClick={() =>
                                navigate(`/documents/${doc.documentId}/upload-version`)
                              }
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-orange-600 px-4 text-xs font-bold text-white shadow-md shadow-orange-600/25 transition hover:bg-orange-700 active:scale-95"
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                              <span>Upload Rev</span>
                            </button>
                          )}

                          <Link to={`/documents/${doc.documentId}`}>
                            <button className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                              <span>Details</span>
                            </button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        {/* الترقيم */}
        {filteredDocuments.length > 0 && (
          <div className="pt-2">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filteredDocuments.length}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setPage(1)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentsListPage