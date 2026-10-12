import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  contractorsApi,
  departmentsApi,
  documentTypesApi,
  documentCategoriesApi,
} from '@/api'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/i18n/useTranslation'
import {
  PlusCircle,
  Building2,
  Network,
  FileSpreadsheet,
  FolderKanban,
  Database,
  Search,
  Sparkles,
  Edit,
  Power,
  PowerOff,
  Layers,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react'
import { toast } from 'sonner'

type LookupSection = 'contractors' | 'departments' | 'types' | 'categories'

const TAB_FROM_QUERY: Record<string, LookupSection> = {
  departments: 'departments',
  contractors: 'contractors',
  'document-types': 'types',
  types: 'types',
  'document-categories': 'categories',
  categories: 'categories',
}

const QUERY_FROM_TAB: Record<LookupSection, string> = {
  departments: 'departments',
  contractors: 'contractors',
  types: 'document-types',
  categories: 'document-categories',
}

export const LookupsPage: React.FC<{ section?: LookupSection }> = ({ section }) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabFromUrl = (() => {
    const q = searchParams.get('tab')
    if (q && TAB_FROM_QUERY[q]) return TAB_FROM_QUERY[q]
    if (section) return section
    return 'departments' as LookupSection
  })()

  const [activeTab, setActiveTab] = useState<LookupSection>(tabFromUrl)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const handleTabChange = useCallback(
    (next: LookupSection) => {
      setActiveTab(next)
      setSearchQuery('')
      setSearchParams({ tab: QUERY_FROM_TAB[next] }, { replace: true })
    },
    [setSearchParams]
  )

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [activeTab, pageSize, searchQuery])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  const [fieldName1, setFieldName1] = useState('')
  const [fieldCode1, setFieldCode1] = useState('')
  /** Selected category IDs when creating/editing a Document Type */
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    id: number
    title: string
    isActivate: boolean
    type: 'contractor' | 'department' | 'type' | 'category'
  }>({ open: false, id: 0, title: '', isActivate: false, type: 'contractor' })

  // استدعاء جداول الثوابت الأربعة من الـ API
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => contractorsApi.getAll(),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(),
  })

  const { data: docTypes = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: () => documentTypesApi.getAll(),
  })

  const { data: docCategories = [] } = useQuery({
    queryKey: ['document-categories'],
    queryFn: () => documentCategoriesApi.getAll(),
  })

  // =========================================================================
  // تحليلات منظومة التكويد والثوابت (Taxonomy & Coding Analytics)
  // =========================================================================
  const analytics = useMemo(() => {
    const totalEntities =
      departments.length + contractors.length + docTypes.length + docCategories.length

    return {
      totalEntities,
      deptCount: departments.length,
      contractorCount: contractors.length,
      typeCount: docTypes.length,
      catCount: docCategories.length,
    }
  }, [departments, contractors, docTypes, docCategories])

  const activeData: any[] = useMemo(() => {
    let source: any[] = []
    if (activeTab === 'contractors') source = contractors
    else if (activeTab === 'departments') source = departments
    else if (activeTab === 'types') source = docTypes
    else source = docCategories

    if (!searchQuery.trim()) return source

    const q = searchQuery.toLowerCase().trim()
    return source.filter((item: any) => {
      const name =
        item.name || item.Name || item.categoryName || item.CategoryName || ''
      const code =
        item.code ||
        item.Code ||
        item.abbreviation ||
        item.Abbreviation ||
        item.categoryCode ||
        item.CategoryCode ||
        ''
      return name.toLowerCase().includes(q) || code.toLowerCase().includes(q)
    })
  }, [activeTab, contractors, departments, docTypes, docCategories, searchQuery])

  const totalPages = Math.max(1, Math.ceil(activeData.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageSlice = (rows: any[]) =>
    rows.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFieldName1('')
    setFieldCode1('')
    setSelectedCategoryIds([])
    setModalOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingItem(item)
    if (activeTab === 'contractors') {
      setFieldName1(item.name || item.Name)
      setFieldCode1(item.abbreviation || item.Abbreviation)
      setSelectedCategoryIds([])
    } else if (activeTab === 'departments') {
      setFieldName1(item.name || item.Name)
      setFieldCode1(item.code || item.Code)
      setSelectedCategoryIds([])
    } else if (activeTab === 'types') {
      setFieldName1(item.name ?? item.Name)
      setFieldCode1(item.abbreviation ?? item.Abbreviation)
      const linked =
        (item.categories as any[] | undefined)?.map(
          (c) => c.categoryId ?? c.CategoryId
        ) ?? []
      setSelectedCategoryIds(linked.filter((id: number) => Number.isFinite(id)))
    } else if (activeTab === 'categories') {
      setFieldName1(item.categoryName || item.CategoryName)
      setFieldCode1(item.categoryCode || item.CategoryCode)
      setSelectedCategoryIds([])
    }
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'contractors') {
        if (editingItem) {
          return await contractorsApi.update(
            editingItem.contractorId || editingItem.ContractorId,
            {
              name: fieldName1.trim(),
              abbreviation: fieldCode1.trim(),
            }
          )
        }
        return await contractorsApi.create({
          name: fieldName1.trim(),
          abbreviation: fieldCode1.trim(),
        })
      } else if (activeTab === 'departments') {
        if (editingItem) {
          return await departmentsApi.update(
            editingItem.departmentId || editingItem.DepartmentId,
            {
              name: fieldName1.trim(),
              code: fieldCode1.trim(),
            }
          )
        }
        return await departmentsApi.create({
          name: fieldName1.trim(),
          code: fieldCode1.trim(),
        })
      } else if (activeTab === 'types') {
        if (editingItem) {
          return await documentTypesApi.update(
            editingItem.documentTypeId ?? editingItem.DocumentTypeId,
            {
              name: fieldName1.trim(),
              abbreviation: fieldCode1.trim(),
              categoryIds: selectedCategoryIds,
            }
          )
        }
        return await documentTypesApi.create({
          name: fieldName1.trim(),
          abbreviation: fieldCode1.trim(),
          categoryIds: selectedCategoryIds,
        })
      } else if (activeTab === 'categories') {
        if (editingItem) {
          return await documentCategoriesApi.update(
            editingItem.categoryId || editingItem.CategoryId,
            {
              categoryName: fieldName1.trim(),
              categoryCode: fieldCode1.trim(),
            }
          )
        }
        return await documentCategoriesApi.create({
          categoryName: fieldName1.trim(),
          categoryCode: fieldCode1.trim(),
        })
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? t('recordUpdated') : t('recordCreated'))
      queryClient.invalidateQueries({ queryKey: [activeTab] })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
      queryClient.invalidateQueries({ queryKey: ['document-categories'] })
      setModalOpen(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      isActivate,
      type,
    }: {
      id: number
      isActivate: boolean
      type: string
    }) => {
      if (type === 'contractor') {
        return isActivate ? contractorsApi.activate(id) : contractorsApi.deactivate(id)
      } else if (type === 'department') {
        return isActivate ? departmentsApi.activate(id) : departmentsApi.deactivate(id)
      } else if (type === 'type') {
        return isActivate ? documentTypesApi.activate(id) : documentTypesApi.deactivate(id)
      } else if (type === 'category') {
        return isActivate
          ? documentCategoriesApi.activate(id)
          : documentCategoriesApi.deactivate(id)
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActivate ? t('activated') : t('deactivated'))
      queryClient.invalidateQueries({ queryKey: [activeTab] })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
      queryClient.invalidateQueries({ queryKey: ['document-categories'] })
      setConfirmDialog({
        open: false,
        id: 0,
        title: '',
        isActivate: false,
        type: 'contractor',
      })
    },
  })

  const tabs = [
    {
      id: 'departments' as LookupSection,
      label: t('departments'),
      icon: <Network className="h-4 w-4" />,
      badge: departments.length,
    },
    {
      id: 'contractors' as LookupSection,
      label: t('contractors'),
      icon: <Building2 className="h-4 w-4" />,
      badge: contractors.length,
    },
    {
      id: 'types' as LookupSection,
      label: t('documentTypes'),
      icon: <FileSpreadsheet className="h-4 w-4" />,
      badge: docTypes.length,
    },
    {
      id: 'categories' as LookupSection,
      label: t('documentCategories'),
      icon: <FolderKanban className="h-4 w-4" />,
      badge: docCategories.length,
    },
  ]

  const tabLabel =
    activeTab === 'contractors'
      ? t('contractors')
      : activeTab === 'departments'
        ? t('departments')
        : activeTab === 'types'
          ? t('documentTypes')
          : t('documentCategories')

  return (
    <div className="space-y-7 pb-14">
      {/* =========================================================
          1. ترويسة الصفحة (Page Header) بنفس ستايل الداشبورد
      ========================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Database className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              System Lookups & Coding Syntax
            </h1>
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Enterprise taxonomy dictionaries governing departments, contractors, and 6-part document numbering keys.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          <span>
            {t('add')} {tabLabel}
          </span>
        </button>
      </div>

      {/* =========================================================
          2. شريط تحليلات الثوابت والمعايير (Lookups Taxonomy KPIs)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Departments */}
        <div
          onClick={() => handleTabChange('departments')}
          className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            activeTab === 'departments'
              ? 'border-purple-500 bg-purple-50/40 dark:border-purple-600 dark:bg-purple-950/30'
              : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#151c28]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Departments
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.deptCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Civil, Arch, MEP, Quality</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Network className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Contractors */}
        <div
          onClick={() => handleTabChange('contractors')}
          className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            activeTab === 'contractors'
              ? 'border-blue-500 bg-blue-50/40 dark:border-blue-600 dark:bg-blue-950/30'
              : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#151c28]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Main Contractors
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.contractorCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Executing entities</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Document Types */}
        <div
          onClick={() => handleTabChange('types')}
          className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            activeTab === 'types'
              ? 'border-emerald-500 bg-emerald-50/40 dark:border-emerald-600 dark:bg-emerald-950/30'
              : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#151c28]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Submittal Types
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.typeCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">DWG, MAT, RFI, MST</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div
          onClick={() => handleTabChange('categories')}
          className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            activeTab === 'categories'
              ? 'border-cyan-500 bg-cyan-50/40 dark:border-cyan-600 dark:bg-cyan-950/30'
              : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#151c28]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Disciplines / Categories
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.catCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Engineering disciplines</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <FolderKanban className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. شريط التبويبات الكبسولي + حقل البحث الذكي
      ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        {/* التبويبات الأربعة بستايل كبسولي */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.2 font-mono text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* حقل البحث السريع */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder={`Search ${tabLabel.toLowerCase()} by code or name...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/70 ps-9 pe-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* =========================================================
          4. جدول البيانات التنفيذي (Executive Data Table)
      ========================================================= */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                <th className="px-5 py-3.5">{t('abbreviationCode')}</th>
                <th className="px-5 py-3.5">{t('officialName')}</th>
                {activeTab === 'types' && <th className="px-5 py-3.5">Linked Disciplines</th>}
                <th className="px-5 py-3.5">{t('status')}</th>
                <th className="px-5 py-3.5">{t('createdDate')}</th>
                <th className="px-5 py-3.5 text-end">{t('actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeData.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === 'types' ? 6 : 5}
                    className="p-8 text-center text-xs text-slate-400"
                  >
                    No records found for this criteria.
                  </td>
                </tr>
              ) : (
                pageSlice(activeData).map((row: any) => {
                  let id: number
                  let code: string
                  let name: string
                  let active: boolean
                  let date: string
                  let codeColorClass = 'text-blue-600 dark:text-blue-400'

                  if (activeTab === 'contractors') {
                    id = row.contractorId ?? row.ContractorId
                    name = row.name ?? row.Name
                    code = row.abbreviation ?? row.Abbreviation
                    active = row.isActive ?? row.IsActive
                    date = row.createdAt ?? row.CreatedAt
                    codeColorClass = 'text-blue-600 dark:text-blue-400'
                  } else if (activeTab === 'departments') {
                    id = row.departmentId ?? row.DepartmentId
                    name = row.name ?? row.Name
                    code = row.code ?? row.Code
                    active = row.isActive ?? row.IsActive
                    date = row.createdAt ?? row.CreatedAt
                    codeColorClass = 'text-purple-600 dark:text-purple-400'
                  } else if (activeTab === 'types') {
                    id = row.documentTypeId ?? row.DocumentTypeId
                    name = row.name ?? row.Name
                    code = row.abbreviation ?? row.Abbreviation
                    active = row.isActive ?? row.IsActive
                    date = row.createdAt ?? row.CreatedAt
                    codeColorClass = 'text-emerald-600 dark:text-emerald-400'
                  } else {
                    id = row.categoryId ?? row.CategoryId
                    name = row.categoryName ?? row.CategoryName
                    code = row.categoryCode ?? row.CategoryCode
                    active = row.isActive ?? row.IsActive
                    date = row.createdAt ?? row.CreatedAt
                    codeColorClass = 'text-cyan-600 dark:text-cyan-400'
                  }

                  const cats: any[] = row.categories ?? []
                  const catLabel =
                    cats.length === 0
                      ? '—'
                      : cats
                          .map((c) => c.categoryCode ?? c.CategoryCode)
                          .filter(Boolean)
                          .slice(0, 4)
                          .join(', ') + (cats.length > 4 ? ` +${cats.length - 4}` : '')

                  return (
                    <tr
                      key={id}
                      className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                    >
                      {/* Code */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-black tracking-wider dark:bg-slate-800 ${codeColorClass}`}
                        >
                          {code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {name}
                      </td>

                      {/* Linked Categories for Types */}
                      {activeTab === 'types' && (
                        <td className="px-5 py-3.5">
                          <span
                            className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300"
                            title={cats.map((c) => c.categoryCode ?? c.CategoryCode).join(', ')}
                          >
                            {catLabel}
                          </span>
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {active ? t('active') : t('inactive')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                        {formatDate(date)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Edit className="h-3 w-3 text-slate-400" />
                            <span>{t('edit')}</span>
                          </button>

                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                id,
                                title: name,
                                isActivate: !active,
                                type:
                                  activeTab === 'contractors'
                                    ? 'contractor'
                                    : activeTab === 'departments'
                                      ? 'department'
                                      : activeTab === 'types'
                                        ? 'type'
                                        : 'category',
                              })
                            }
                            className={`inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${
                              active
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {active ? (
                              <>
                                <PowerOff className="h-3 w-3" />
                                <span>{t('deactivate')}</span>
                              </>
                            ) : (
                              <>
                                <Power className="h-3 w-3" />
                                <span>{t('activate')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* الترقيم */}
      <div className="pt-2">
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={activeData.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ========== CREATE / EDIT MODAL ========== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingItem
            ? `${t('editTab')} ${tabLabel}`
            : `${t('createNewTab')} ${tabLabel}`
        }
        description={t('modalDescription')}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              {t('codeAbbreviation')} *
            </label>
            <Input
              required
              value={fieldCode1}
              onChange={(e) => setFieldCode1(e.target.value)}
              placeholder={t('codePlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              {t('nameRequired')} *
            </label>
            <Input
              required
              value={fieldName1}
              onChange={(e) => setFieldName1(e.target.value)}
              placeholder={t('namePlaceholder')}
            />
          </div>

          {activeTab === 'types' && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Linked Categories / Disciplines
              </label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-700 dark:bg-slate-900/40">
                {docCategories.filter((c: any) => c.isActive !== false).length === 0 && (
                  <p className="text-xs text-slate-500">No active categories available.</p>
                )}
                {docCategories
                  .filter((c: any) => c.isActive !== false)
                  .map((c: any) => {
                    const cid = c.categoryId ?? c.CategoryId
                    const checked = selectedCategoryIds.includes(cid)
                    return (
                      <label
                        key={cid}
                        className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={() => {
                            setSelectedCategoryIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== cid)
                                : [...prev, cid]
                            )
                          }}
                        />
                        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          {c.categoryCode ?? c.CategoryCode}
                        </span>
                        <span>{c.categoryName ?? c.CategoryName}</span>
                      </label>
                    )
                  })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Select disciplines linked to this document type ({selectedCategoryIds.length} selected).
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saveMutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saveMutation.isPending}
            >
              {editingItem ? t('saveChanges') : t('createRecord')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== CONFIRM DIALOG ========== */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({
            open: false,
            id: 0,
            title: '',
            isActivate: false,
            type: 'contractor',
          })
        }
        onConfirm={() => toggleMutation.mutate(confirmDialog)}
        title={confirmDialog.isActivate ? t('activateRecord') : t('deactivateRecord')}
        message={`${
          confirmDialog.isActivate ? t('confirmActivate') : t('confirmDeactivate')
        } "${confirmDialog.title}"?`}
        confirmText={confirmDialog.isActivate ? t('activate') : t('deactivate')}
        isDestructive={!confirmDialog.isActivate}
        isLoading={toggleMutation.isPending}
      />
    </div>
  )
}

export default LookupsPage