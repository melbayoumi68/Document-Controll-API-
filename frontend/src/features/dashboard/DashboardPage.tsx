import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { contractsApi, documentsApi, documentVersionsApi } from '@/api'
import { useUserStore, useUIStore } from '@/stores'
import { DocumentStatuses, type Document } from '@/types'
import { CopyButton } from '@/components/common/CopyButton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/lib/utils'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  FileCheck,
  FileStack,
  FileText,
  Filter,
  HardHat,
  Layers,
  Loader2,
  PieChart,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

export const DashboardPage: React.FC = () => {
  const { currentUser, isSuperAdmin, isEngineer, isConsultant } = useUserStore()
  const { openReview } = useUIStore()
  const navigate = useNavigate()
  const [resolvingDocId, setResolvingDocId] = useState<number | null>(null)
  const [selectedContractFilter, setSelectedContractFilter] = useState<string>('ALL')

  const isAdmin = isSuperAdmin()

  // 1. استدعاء المستندات
  const { data: scopedDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', 'dashboard', isAdmin ? 'all' : 'mine', currentUser?.userId],
    queryFn: () => (isAdmin ? documentsApi.getAll() : documentsApi.getMyDocuments()),
    enabled: !!currentUser,
  })

  // 2. استدعاء العقود
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', 'dashboard', isAdmin ? 'all' : 'mine', currentUser?.userId],
    queryFn: () => (isAdmin ? contractsApi.getAll() : contractsApi.getMine()),
    enabled: !!currentUser,
  })

  // 3. المستندات المعلقة للاستشاري
  const { data: pendingForConsultant = [] } = useQuery({
    queryKey: ['documents', 'pending-for-me', currentUser?.userId],
    queryFn: () => documentsApi.getPendingForMe(),
    enabled: isConsultant() && !!currentUser,
  })

  // 4. المستندات المطلوب تعديلها من المهندس (Rating C)
  const { data: requiresRevisionDocs = [] } = useQuery({
    queryKey: ['documents', 'requires-revision-for-me', currentUser?.userId],
    queryFn: () => documentsApi.getRequiresRevisionForMe(),
    enabled: isEngineer() && !!currentUser,
  })

  // تصفية المستندات بناء على العقد المختار
  const filteredDocs = useMemo(() => {
    if (selectedContractFilter === 'ALL') return scopedDocs
    return scopedDocs.filter((d: any) => d.contractId?.toString() === selectedContractFilter)
  }, [scopedDocs, selectedContractFilter])

  // =========================================================================
  // الحسابات التحليلية للمكتب الفني (Engineering Technical Office Analytics)
  // =========================================================================
  const totalDocs = filteredDocs.length
  const pendingCount = filteredDocs.filter((d) => d.status === DocumentStatuses.PendingReview).length
  const revisionCount = filteredDocs.filter((d) => d.status === DocumentStatuses.RequiresRevision).length
  const approvedCount = filteredDocs.filter(
    (d) => d.status === DocumentStatuses.Approved || d.status === DocumentStatuses.ApprovedWithComments
  ).length
  const rejectedCount = filteredDocs.filter((d) => d.status === DocumentStatuses.Rejected).length

  // First Time Acceptance Rate (FTAR): المستندات المعتمدة من أول إصدار (Rev 00 / Rev 01)
  const firstTimeApproved = filteredDocs.filter(
    (d) =>
      (d.status === DocumentStatuses.Approved || d.status === DocumentStatuses.ApprovedWithComments) &&
      (d.currentVersionNumber === '01' || d.currentVersionNumber === '00' || d.currentVersionNumber === '1')
  ).length

  const ftarRate = approvedCount > 0 ? Math.round((firstTimeApproved / approvedCount) * 100) : 0
  const completionRate = totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0

  // توزيع قرارات المراجعة الهندسية (Code A, B, C, D)
  const reviewCodesData = useMemo(() => {
    const codeA = filteredDocs.filter((d) => d.status === DocumentStatuses.Approved).length
    const codeB = filteredDocs.filter((d) => d.status === DocumentStatuses.ApprovedWithComments).length
    const codeC = revisionCount
    const codeD = rejectedCount
    const total = codeA + codeB + codeC + codeD || 1

    return {
      codeA,
      codeB,
      codeC,
      codeD,
      pctA: Math.round((codeA / total) * 100),
      pctB: Math.round((codeB / total) * 100),
      pctC: Math.round((codeC / total) * 100),
      pctD: Math.round((codeD / total) * 100),
    }
  }, [filteredDocs, revisionCount, rejectedCount])

  // توزيع أنواع المستندات (Shop Drawings, Material Submittal, RFI, Method Statement)
  const docTypesDistribution = useMemo(() => {
    const typesMap: Record<string, number> = {
      'Shop Drawings': 0,
      'Material Submittals': 0,
      'RFIs / Queries': 0,
      'Method Statements': 0,
      'Inspection Requests': 0,
    }

    filteredDocs.forEach((d: any) => {
      const typeName = d.documentTypeName || d.typeName || 'Shop Drawings'
      if (typesMap[typeName] !== undefined) {
        typesMap[typeName]++
      } else {
        typesMap['Shop Drawings']++
      }
    })

    return Object.entries(typesMap)
  }, [filteredDocs])

  // أحدث المستندات
  const recentDocs = useMemo(() => {
    return [...filteredDocs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  }, [filteredDocs])

  const handleReviewNow = async (doc: Document) => {
    setResolvingDocId(doc.documentId)
    try {
      const versions = await documentVersionsApi.getByDocument(doc.documentId)
      if (!versions || versions.length === 0) {
        toast.error('No file version exists for this document yet.')
        return
      }
      const current =
        versions.find((v) => v.versionNumber === doc.currentVersionNumber) ??
        versions.reduce((max, v) => (v.versionId > max.versionId ? v : max), versions[0])
      openReview(current.versionId, doc.documentNumber, current.versionNumber)
    } catch {
      // handled by interceptor
    } finally {
      setResolvingDocId(null)
    }
  }

  return (
    <div className="space-y-7 pb-14">
      {/* =========================================================
          1. الترويسة الرئيسية + شريط الفلاتر والإجراءات السريعة
      ========================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Engineering Hub •{' '}
              <span className="text-blue-600 dark:text-blue-400">
                {currentUser?.fullName || 'Technical Engineer'}
              </span>
            </h1>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>DC Document Control Operations</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              <HardHat className="h-3 w-3" />
              {currentUser?.role || 'Guest'}
            </span>
            <span>•</span>
            <span className="text-slate-400 font-mono">ISO 19650 & CDE Compliant</span>
          </div>
        </div>

        {/* أدوات التصفية والتقديم السريع */}
        <div className="flex flex-wrap items-center gap-2.5">
          {contracts.length > 0 && (
            <div className="relative">
              <select
                value={selectedContractFilter}
                onChange={(e) => setSelectedContractFilter(e.target.value)}
                className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 pe-9 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Contracts ({contracts.length})</option>
                {contracts.map((c) => (
                  <option key={c.contractId} value={c.contractId.toString()}>
                    {c.contractCode} - {c.contractName}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute end-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          {(isEngineer() || isSuperAdmin()) && (
            <button
              onClick={() => navigate('/documents/submit')}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Submit Submittal</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          2. شريط المؤشرات الهندسية الدقيقة (Engineering KPIs)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Documents */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Submittals
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {totalDocs}
              </h3>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                Across {contracts.length} active contract(s)
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400">
              <FileStack className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Pending Review / Consultant Queue */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Under Consultant Review
              </p>
              <h3 className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">
                {pendingCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Avg turnaround SLA: 7 days</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* First Time Approval Rate (FTAR) - مؤشر كفاءة المكتب الفني */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                First-Time Acceptance
              </p>
              <h3 className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {ftarRate}%
              </h3>
              <p className="mt-1 text-xs text-slate-400">Approved on Rev 00/01</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Code C Revisions (مطلوب إعادة التقديم) */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Action Required (Code C)
              </p>
              <h3 className="mt-1 text-3xl font-black text-orange-600 dark:text-orange-400">
                {revisionCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Requires Rev 02+ re-submittal</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white dark:bg-orange-950/60 dark:text-orange-400">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. قسم التشارتات والرسومات الهندسية التفاعلية (CHARTS)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* CHART 1: توزيع قرارات الاستشاري (Code A, B, C, D Donut Breakdown) - 5 أعمدة */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  Consultant Decision Ratings
                </h3>
                <p className="text-xs text-slate-400">FIDIC & Engineering Standard Review Codes</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {approvedCount + revisionCount + rejectedCount} Evaluated
              </span>
            </div>

            {/* الرسم الدائري SVG التفاعلي بدون أي مكاتب خارجية */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* خلفية الدائرة */}
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Code A (Emerald) */}
                  <path
                    className="text-emerald-500 transition-all duration-1000"
                    strokeDasharray={`${reviewCodesData.pctA}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Code B (Blue) */}
                  <path
                    className="text-blue-500 transition-all duration-1000"
                    strokeDasharray={`${reviewCodesData.pctB}, 100`}
                    strokeDashoffset={`-${reviewCodesData.pctA}`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Code C (Orange) */}
                  <path
                    className="text-orange-500 transition-all duration-1000"
                    strokeDasharray={`${reviewCodesData.pctC}, 100`}
                    strokeDashoffset={`-${reviewCodesData.pctA + reviewCodesData.pctB}`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Code D (Rose) */}
                  <path
                    className="text-rose-500 transition-all duration-1000"
                    strokeDasharray={`${reviewCodesData.pctD}, 100`}
                    strokeDashoffset={`-${reviewCodesData.pctA + reviewCodesData.pctB + reviewCodesData.pctC}`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                {/* مركز الدائرة */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {completionRate}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Approved
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* مفتاح الرموز الهندسية للكود (Legend) */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-2 text-xs dark:border-emerald-950 dark:bg-emerald-950/20">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Code A (Approved)
              </span>
              <span className="font-mono font-bold">{reviewCodesData.codeA}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-2 text-xs dark:border-blue-950 dark:bg-blue-950/20">
              <span className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Code B (As Noted)
              </span>
              <span className="font-mono font-bold">{reviewCodesData.codeB}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/50 p-2 text-xs dark:border-orange-950 dark:bg-orange-950/20">
              <span className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-400">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                Code C (Revise)
              </span>
              <span className="font-mono font-bold">{reviewCodesData.codeC}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 p-2 text-xs dark:border-rose-950 dark:bg-rose-950/20">
              <span className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Code D (Rejected)
              </span>
              <span className="font-mono font-bold">{reviewCodesData.codeD}</span>
            </div>
          </div>
        </div>

        {/* CHART 2: توزيع مجالات المستندات (Submittal Types Breakdown) - 7 أعمدة */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Submittals Volume by Discipline / Type
                </h3>
                <p className="text-xs text-slate-400">Categorized from DocumentTypes and Categories</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">Live Registry Feed</span>
            </div>

            {/* رسم بياني شريطي هندسي (Horizontal Bar Chart) */}
            <div className="space-y-4 pt-5">
              {docTypesDistribution.map(([type, count]) => {
                const pct = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {count} docs
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">({pct}%)</span>
                      </div>
                    </div>
                    {/* شريط التقدم */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* شريط الإحصائيات السريعة أسفل الشارت */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50/60 p-3.5 text-xs font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Electronic Document Management System (EDMS)
            </span>
            <span className="font-mono text-[11px]">Active Coding Pattern: 6-Block Syntax</span>
          </div>
        </div>

      </div>

      {/* =========================================================
          4. كارت الإجراءات السريعة (Consultant Queue & Revisions)
      ========================================================= */}
      {isConsultant() && pendingForConsultant.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-purple-200/90 bg-white shadow-sm dark:border-purple-900/50 dark:bg-[#151c28]">
          <div className="flex flex-row items-center justify-between border-b border-purple-100 bg-purple-50/70 p-4 sm:p-5 dark:border-purple-900/40 dark:bg-purple-950/30">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-600 p-2.5 text-white shadow-sm shadow-purple-600/30">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-purple-950 dark:text-purple-200">
                  Documents Awaiting Your Engineering Review ({pendingForConsultant.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submittals requiring Consultant review determination (Code A, B, C, or D)
                </p>
              </div>
            </div>
            <Link to="/reviews/pending">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-purple-300 bg-white px-4 text-xs font-bold text-purple-700 transition hover:bg-purple-50 dark:border-purple-700 dark:bg-slate-800 dark:text-purple-300">
                <span>Go to Review Center</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingForConsultant.slice(0, 4).map((doc) => (
              <div
                key={doc.documentId}
                className="flex flex-col justify-between gap-3 p-4 transition hover:bg-purple-50/30 dark:hover:bg-purple-950/20 sm:flex-row sm:items-center sm:px-6"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/documents/${doc.documentId}`}
                      className="font-mono text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {doc.documentNumber}
                    </Link>
                    <CopyButton text={doc.documentNumber} />
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Rev {doc.currentVersionNumber}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {doc.title || '—'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewNow(doc)}
                    disabled={resolvingDocId !== null}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-purple-600 px-5 text-xs font-bold text-white shadow-md shadow-purple-600/25 transition hover:bg-purple-700 active:scale-95"
                  >
                    {resolvingDocId === doc.documentId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckSquare className="h-3.5 w-3.5" />
                    )}
                    <span>Review & Rate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          5. أحدث المستندات + العقود والمشاريع (Recent Documents)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Submittals List (8 Columns) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Activity className="h-4 w-4 text-blue-600" />
                Recent Submittals Stream
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Real-time submittal log and consultant review ratings
              </p>
            </div>
            <Link to={isAdmin ? '/admin/documents' : '/documents'}>
              <button className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                <span>View Full Registry</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </div>

          <div className="pt-2">
            {recentDocs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No documents found for this contract selection.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="flex items-center justify-between rounded-2xl px-2 py-3.5 transition hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                  >
                    <div className="min-w-0 pe-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/documents/${doc.documentId}`}
                          className="truncate font-mono text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 sm:text-sm"
                        >
                          {doc.documentNumber}
                        </Link>
                        <CopyButton text={doc.documentNumber} />
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                          Rev {doc.currentVersionNumber}
                        </span>
                      </div>
                      <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                        {doc.title || '—'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <StatusBadge status={doc.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Contracts Quick Overview (4 Columns) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                Contracts Registry ({contracts.length})
              </h3>
            </div>

            <div className="space-y-2.5 pt-4">
              {contracts.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No contracts assigned to you yet.
                </p>
              ) : (
                contracts.slice(0, 4).map((contract) => (
                  <Link
                    key={contract.contractId}
                    to="/contracts"
                    className="group block rounded-2xl border border-slate-200/70 bg-slate-50/50 p-3 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {contract.contractCode}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {contract.projectName || 'Active Project'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                      {contract.contractName || '—'}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Link to={isAdmin ? '/admin/contracts' : '/contracts'} className="block">
              <button className="h-10 w-full rounded-full border border-blue-200 bg-blue-50/60 text-xs font-bold text-blue-700 transition hover:bg-blue-100/80 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                View All Contracts & Projects
              </button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardPage