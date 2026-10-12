import React, { useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  contractsApi,
  documentTypesApi,
  documentCategoriesApi,
  contractorsApi,
  documentsApi,
} from '@/api'
import { useUserStore } from '@/stores'
import { Dropzone } from '@/components/ui/Dropzone'
import { toast } from 'sonner'
import { useCodingOrder } from '@/hooks/useCodingOrder'
import { DEFAULT_CODING_ORDER } from '@/types/coding'
import {
  Sparkles,
  FileText,
  Briefcase,
  Layers,
  Info,
  UploadCloud,
  ArrowLeft,
  FileCheck2,
  Calendar,
  Building2,
  MapPin,
  Send,
  CheckCircle2,
  Compass,
} from 'lucide-react'

export const SubmitDocumentPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isEngineer } = useUserStore()
  const { data: codingOrder } = useCodingOrder()

  // Form state
  const [contractId, setContractId] = useState('')
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [documentCategoryId, setDocumentCategoryId] = useState('')
  const [contractorId, setContractorId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [inspectionRef, setInspectionRef] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [zone, setZone] = useState('')
  const [building, setBuilding] = useState('')
  const [axis, setAxis] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()
  const [errors, setErrors] = useState<{
    contractId?: string
    documentTypeId?: string
    documentCategoryId?: string
  }>({})

  // Dropdown data — engineers only ever see their own assigned contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', isEngineer() ? 'mine' : 'all'],
    queryFn: () => (isEngineer() ? contractsApi.getMine() : contractsApi.getAll()),
  })

  const { data: docTypes = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: () => documentTypesApi.getAll(),
  })

  // Categories filtered by selected Document Type (active linked only)
  const typeIdNum = documentTypeId ? parseInt(documentTypeId, 10) : NaN
  const {
    data: docCategories = [],
    isFetching: categoriesLoading,
  } = useQuery({
    queryKey: ['document-categories', 'by-type', typeIdNum],
    queryFn: () => documentCategoriesApi.getByDocumentType(typeIdNum),
    enabled: Number.isFinite(typeIdNum) && typeIdNum > 0,
  })

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors', 'active'],
    queryFn: () => contractorsApi.getAll(true),
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const errs: typeof errors = {}
      if (!contractId) errs.contractId = 'Contract package is required.'
      if (!documentTypeId) errs.documentTypeId = 'Document Type is required.'
      if (!documentCategoryId) errs.documentCategoryId = 'Discipline Category is required.'
      setErrors(errs)
      if (Object.keys(errs).length > 0) throw new Error('Please complete the required fields.')

      if (!file) {
        setFileError('Official engineering document file is required.')
        throw new Error('Please select a file.')
      }

      return await documentsApi.submit({
        contractId: parseInt(contractId, 10),
        documentTypeId: parseInt(documentTypeId, 10),
        documentCategoryId: parseInt(documentCategoryId, 10),
        contractorId: contractorId ? parseInt(contractorId, 10) : undefined,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        inspectionRef: inspectionRef.trim() || undefined,
        issueDate: issueDate || undefined,
        inspectionDate: inspectionDate || undefined,
        dueDate: dueDate || undefined,
        zone: zone.trim() || undefined,
        building: building.trim() || undefined,
        axis: axis.trim() || undefined,
        remarks: remarks.trim() || undefined,
        file,
      })
    },
    onSuccess: (newDoc) => {
      toast.success(`Submittal ${newDoc.documentNumber} dispatched successfully!`)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate(`/documents/${newDoc.documentId}`)
    },
  })

  // المعاينة الحية لترقيم المستند الرسمي
  const selectedContract = contracts.find((c) => c.contractId === parseInt(contractId, 10))
  const selectedType = docTypes.find(
    (t: any) => (t.documentTypeId ?? t.DocumentTypeId) === parseInt(documentTypeId, 10)
  )
  const selectedCategory = docCategories.find(
    (c) => c.categoryId === parseInt(documentCategoryId, 10)
  )
  const selectedContractor = contractors.find(
    (c) => c.contractorId === parseInt(contractorId, 10)
  )

  const partValues: Record<string, string> = {
    ProjectCode:
      (selectedContract as any)?.projectCode ||
      selectedContract?.projectName?.split(' ')[0] ||
      'PRJ',
    FormAbbreviation:
      (selectedType as any)?.abbreviation ||
      (selectedType as any)?.Abbreviation ||
      'DOC',
    ContractorAbbreviation:
      (selectedContractor as any)?.abbreviation ||
      (selectedContractor as any)?.Abbreviation ||
      'NA',
    CategoryCode:
      (selectedCategory as any)?.categoryCode ||
      (selectedCategory as any)?.CategoryCode ||
      'CAT',
    Serial: '####',
    Revision: '01',
  }

  const order = codingOrder?.length ? codingOrder : DEFAULT_CODING_ORDER

  return (
    <div className="space-y-7 pb-16">
      {/* =========================================================
          1. ترويسة الصفحة التنفيذية (Header)
      ========================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/documents"
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Registry</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Submit New Engineering Document
            </h1>
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Create an official submittal package with automated ISO 19650 coding & revision control.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 sm:self-auto">
          <Layers className="h-3.5 w-3.5" />
          <span>Initial Submittal · Rev 01</span>
        </span>
      </div>

      {/* =========================================================
          2. شريط المعاينة الحية للترقيم (Live Coding Ribbon)
      ========================================================= */}
      <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 p-5 shadow-sm dark:border-blue-900/60 dark:from-blue-950/40 dark:via-slate-900/50 dark:to-blue-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Official Document Number Preview
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Dynamic 6-part coding scheme · Serial number will be generated on submission
              </p>
            </div>
          </div>

          {/* تفصيل أجزاء الكود ككبسولات هندسية */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            {order.map((item, idx) => {
              const val = partValues[item.part] ?? '—'
              const isHighlight =
                item.part === 'ProjectCode'
                  ? 'bg-blue-600 text-white'
                  : item.part === 'Serial'
                    ? 'bg-amber-500 text-white'
                    : item.part === 'Revision'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-800 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'

              return (
                <React.Fragment key={item.part}>
                  <div
                    className={`flex flex-col items-center rounded-xl px-2.5 py-1 text-center shadow-xs ${isHighlight}`}
                    title={item.displayLabel}
                  >
                    <span className="text-[9px] font-sans font-bold uppercase opacity-75">
                      {item.displayLabel}
                    </span>
                    <span className="text-xs font-black">{val}</span>
                  </div>
                  {idx < order.length - 1 && (
                    <span className="text-xs font-bold text-slate-400">/</span>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          3. النموذج الرئيسي (Main Submission Form)
      ========================================================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitMutation.mutate()
        }}
        className="space-y-6"
      >
        {/* Section 1: حزمة العقد والمشروع */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-black">
                1
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Project & Contract Package
              </h2>
            </div>
          </div>

          <div className="p-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select Contract Package <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={contractId}
                  onChange={(e) => {
                    setContractId(e.target.value)
                    if (errors.contractId) setErrors((p) => ({ ...p, contractId: undefined }))
                  }}
                  className={`h-11 w-full rounded-2xl border bg-slate-50/70 px-4 pe-9 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:bg-slate-800/80 dark:text-slate-100 ${
                    errors.contractId
                      ? 'border-rose-400 ring-2 ring-rose-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">
                    {isEngineer()
                      ? 'Select one of your assigned contracts...'
                      : 'Select a project contract...'}
                  </option>
                  {contracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractCode} — {c.contractName} ({c.projectName || `Project #${c.projectId}`})
                    </option>
                  ))}
                </select>
              </div>

              {errors.contractId && (
                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                  {errors.contractId}
                </p>
              )}
              {isEngineer() && (
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  🔒 Filtered strictly to your active assigned contracts in the RBAC matrix.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: التصنيف الهندسي والتخصص */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-black">
                2
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Engineering Discipline & Classification
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
            {/* نوع المستند */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentTypeId}
                onChange={(e) => {
                  setDocumentTypeId(e.target.value)
                  setDocumentCategoryId('')
                  if (errors.documentTypeId) setErrors((p) => ({ ...p, documentTypeId: undefined }))
                  if (errors.documentCategoryId)
                    setErrors((p) => ({ ...p, documentCategoryId: undefined }))
                }}
                className={`h-11 w-full rounded-2xl border bg-slate-50/70 px-4 pe-9 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:bg-slate-800/80 dark:text-slate-100 ${
                  errors.documentTypeId
                    ? 'border-rose-400 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">Select document type...</option>
                {docTypes
                  .filter((t: any) => t.isActive !== false)
                  .map((t: any) => (
                    <option
                      key={t.documentTypeId ?? t.DocumentTypeId}
                      value={t.documentTypeId ?? t.DocumentTypeId}
                    >
                      {(t.abbreviation ?? t.Abbreviation) + ' - ' + (t.name ?? t.Name)}
                    </option>
                  ))}
              </select>
              {errors.documentTypeId && (
                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                  {errors.documentTypeId}
                </p>
              )}
            </div>

            {/* تخصص المستند */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Discipline / Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentCategoryId}
                onChange={(e) => {
                  setDocumentCategoryId(e.target.value)
                  if (errors.documentCategoryId)
                    setErrors((p) => ({ ...p, documentCategoryId: undefined }))
                }}
                disabled={!documentTypeId || categoriesLoading}
                className={`h-11 w-full rounded-2xl border bg-slate-50/70 px-4 pe-9 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800/80 dark:text-slate-100 ${
                  errors.documentCategoryId
                    ? 'border-rose-400 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">
                  {!documentTypeId
                    ? 'Select document type first...'
                    : categoriesLoading
                      ? 'Loading disciplines...'
                      : 'Select category...'}
                </option>
                {docCategories.map((c: any) => (
                  <option key={c.categoryId ?? c.CategoryId} value={c.categoryId ?? c.CategoryId}>
                    {(c.categoryCode ?? c.CategoryCode) + ' - ' + (c.categoryName ?? c.CategoryName)}
                  </option>
                ))}
              </select>
              {errors.documentCategoryId && (
                <p className="mt-1.5 text-xs font-semibold text-rose-500">
                  {errors.documentCategoryId}
                </p>
              )}
            </div>

            {/* المقاول المنفذ */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Contractor Company <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 pe-9 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              >
                <option value="">Select contractor...</option>
                {contractors.map((c: any) => (
                  <option key={c.contractorId ?? c.ContractorId} value={c.contractorId ?? c.ContractorId}>
                    {(c.abbreviation ?? c.Abbreviation) + ' - ' + (c.name ?? c.Name)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: بيانات المستند الفني */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-black">
                3
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Submittal Details & Notes
              </h2>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Submittal Title <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Foundation Structural Details - Zone 01 / Level B2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={300}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Technical Scope Description
                </label>
                <textarea
                  placeholder="Detailed engineering scope of this submittal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Notes for Consultant Reviewer
                </label>
                <textarea
                  placeholder="Direct instructions or reference notes for the consultant..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: إحداثيات الموقع والتواريخ (Log Sheet) */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-black">
                4
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Log Sheet Coordinates & Timeline
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Inspection Ref No.
              </label>
              <input
                type="text"
                value={inspectionRef}
                onChange={(e) => setInspectionRef(e.target.value)}
                placeholder="IR-####"
                maxLength={100}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Inspection Date
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Due Target Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Zone / Area
              </label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Zone A"
                maxLength={100}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Building / Level
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Tower B - Level 04"
                maxLength={100}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Structural Grid / Axis
              </label>
              <input
                type="text"
                value={axis}
                onChange={(e) => setAxis(e.target.value)}
                placeholder="Grid 4-C to 8-F"
                maxLength={100}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Technical Office Remarks
              </label>
              <textarea
                placeholder="Additional field comments or site observations..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 5: إرفاق الملف الهندسي */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white text-xs font-black">
                5
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Official Engineering File Attachment <span className="text-rose-500">*</span>
              </h2>
            </div>
          </div>

          <div className="p-6">
            <Dropzone
              file={file}
              onFileSelect={(f) => {
                setFile(f)
                if (f) setFileError(undefined)
              }}
              error={fileError}
            />
          </div>
        </div>

        {/* =========================================================
            أزرار الإرسال والإلغاء الكبسولية
        ========================================================= */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            disabled={submitMutation.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitMutation.isPending || !file}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-8 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitMutation.isPending ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Submitting Submittal...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Document</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubmitDocumentPage