import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi, projectsApi } from '@/api'
import { useUserStore } from '@/stores'
import { Contract } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/i18n/useTranslation'
import {
  PlusCircle,
  UserCheck,
  Edit,
  Power,
  PowerOff,
  Search,
  Calendar,
  FileText,
  Briefcase,
  Layers,
  HardHat,
  FileStack,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

export const ContractsPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useUserStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAdmin = isSuperAdmin()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  // Form states
  const [projectId, setProjectId] = useState<string>('')
  const [contractName, setContractName] = useState('')
  const [contractCode, setContractCode] = useState('')
  const [startDate, setStartDate] = useState('')

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    contract: Contract | null
    isActivate: boolean
  }>({ open: false, contract: null, isActivate: false })

  // Role-scoped data: admin → all contracts, engineer/consultant → assigned only.
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', isAdmin ? 'all' : 'mine', currentUser?.userId],
    queryFn: () => (isAdmin ? contractsApi.getAll() : contractsApi.getMine()),
    enabled: !!currentUser,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(true),
    enabled: modalOpen && isAdmin,
  })

  // =========================================================================
  // تحليلات حزم الأعمال والعقود (Contracts Portfolio Analytics)
  // =========================================================================
  const analytics = useMemo(() => {
    const totalContracts = contracts.length
    const activeContracts = contracts.filter((c) => c.isActive).length
    const inactiveContracts = totalContracts - activeContracts
    const totalSubmittals = contracts.reduce((sum, c) => sum + (c.documentsCount ?? 0), 0)
    const totalEngineers = contracts.reduce((sum, c) => sum + (c.engineersCount ?? 0), 0)
    const totalConsultants = contracts.reduce((sum, c) => sum + (c.consultantsCount ?? 0), 0)

    const activeRate =
      totalContracts > 0 ? Math.round((activeContracts / totalContracts) * 100) : 0

    return {
      totalContracts,
      activeContracts,
      inactiveContracts,
      totalSubmittals,
      totalEngineers,
      totalConsultants,
      activeRate,
    }
  }, [contracts])

  // التصفية والبحث
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.contractName.toLowerCase().includes(q) ||
        c.contractCode.toLowerCase().includes(q) ||
        (c.projectName && c.projectName.toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && c.isActive) ||
        (statusFilter === 'INACTIVE' && !c.isActive)

      return matchesSearch && matchesStatus
    })
  }, [contracts, searchQuery, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedContracts = filteredContracts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  const handleOpenCreate = () => {
    setEditingContract(null)
    setProjectId(projects[0]?.projectId?.toString() || '')
    setContractName('')
    setContractCode('')
    setStartDate('')
    setModalOpen(true)
  }

  const handleOpenEdit = (c: Contract) => {
    setEditingContract(c)
    setProjectId(c.projectId.toString())
    setContractName(c.contractName)
    setContractCode(c.contractCode)
    setStartDate(c.startDate ? c.startDate.split('T')[0] : '')
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingContract) {
        return await contractsApi.update(editingContract.contractId, {
          contractName: contractName.trim(),
          contractCode: contractCode.trim(),
          startDate: startDate || undefined,
        })
      } else {
        return await contractsApi.create({
          projectId: parseInt(projectId, 10),
          contractName: contractName.trim(),
          contractCode: contractCode.trim(),
          startDate: startDate || undefined,
        })
      }
    },
    onSuccess: () => {
      toast.success(editingContract ? t('recordUpdated') : 'Contract created!')
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setModalOpen(false)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActivate }: { id: number; isActivate: boolean }) => {
      if (isActivate) {
        await contractsApi.activate(id)
      } else {
        await contractsApi.deactivate(id)
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActivate ? t('activated') : t('deactivated'))
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setConfirmDialog({ open: false, contract: null, isActivate: false })
    },
  })

  return (
    <div className="space-y-7 pb-14">
      {/* =========================================================
          1. ترويسة الصفحة (Page Header) بنفس ستايل الداشبورد
      ========================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Briefcase className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Works Packages & Contracts
            </h1>
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'Full registry of works packages, assigned contractor engineers, and consultant review boards.'
              : 'Works packages you are currently assigned to as technical engineer or consultant.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Contract Package</span>
          </button>
        )}
      </div>

      {/* =========================================================
          2. شريط تحليلات العقود (Contracts Portfolio Analytics KPIs)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Contracts */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Works Packages
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.totalContracts}
              </h3>
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {analytics.activeContracts} Active ({analytics.activeRate}%)
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Total Submittals */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Submittals Volume
              </p>
              <h3 className="mt-1 text-3xl font-black text-cyan-600 dark:text-cyan-400">
                {analytics.totalSubmittals}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Across all package registries</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-600 group-hover:text-white dark:bg-cyan-950/60 dark:text-cyan-400">
              <FileStack className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Contractor Engineers */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Technical Engineers
              </p>
              <h3 className="mt-1 text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {analytics.totalEngineers}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Site & technical office staffing</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400">
              <HardHat className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Supervising Consultants */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Supervising Consultants
              </p>
              <h3 className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics.totalConsultants}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Reviewers & approval authorities</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400">
              <Compass className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. شريط البحث والفلترة الذكي (Smart Filters Bar)
      ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        {/* حقل البحث */}
        <div className="relative min-w-[260px] flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search by contract code, package name, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/70 ps-10 pe-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>

        {/* فلترة الحالة */}
        <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All ({contracts.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Active ({analytics.activeContracts})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Inactive ({analytics.inactiveContracts})
          </button>
        </div>
      </div>

      {/* =========================================================
          4. شبكة كروت العقود التنفيذية (Executive Contract Cards)
      ========================================================= */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-60 w-full rounded-3xl" />
          <Skeleton className="h-60 w-full rounded-3xl" />
          <Skeleton className="h-60 w-full rounded-3xl" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          title="No contracts found"
          description={
            isAdmin
              ? 'Create contracts under your projects to begin document control workflows.'
              : 'You are not currently assigned to any contracts matching this query.'
          }
          action={
            isAdmin && (
              <Button size="sm" onClick={handleOpenCreate}>
                Create Contract
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pagedContracts.map((contract) => (
              <div
                key={contract.contractId}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#151c28] dark:hover:border-blue-900"
              >
                {/* رأس الكارت */}
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-blue-50 px-2.5 py-1 font-mono text-xs font-black tracking-wider text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                        {contract.contractCode}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        contract.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          contract.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {contract.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>

                  {/* اسم الحزمة واسم المشروع */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {contract.contractName}
                    </h3>

                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                      <Layers className="h-3 w-3 text-blue-500" />
                      Project:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {contract.projectName || `Project #${contract.projectId}`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* مؤشرات حزمة العمل: المستندات + المهندسين + الاستشاريين */}
                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/80 p-2.5 text-center dark:bg-slate-900/50">
                    <div className="rounded-xl bg-white p-2 shadow-xs dark:bg-slate-800">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Submittals
                      </span>
                      <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                        {contract.documentsCount ?? 0}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2 shadow-xs dark:bg-slate-800">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Engineers
                      </span>
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {contract.engineersCount ?? 0}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2 shadow-xs dark:bg-slate-800">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                        Consultants
                      </span>
                      <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {contract.consultantsCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {contract.startDate && (
                    <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Started: {formatDate(contract.startDate)}</span>
                    </p>
                  )}

                  {/* أزرار الإجراءات السفلية */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <button
                      onClick={() => navigate(`/documents?contractId=${contract.contractId}`)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-blue-50 px-3.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Documents ({contract.documentsCount ?? 0})</span>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            navigate('/admin/assignments', {
                              state: { contractId: contract.contractId },
                            })
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          title="Assign Team"
                        >
                          <UserCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span>Assign</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(contract)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Edit Contract"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              contract,
                              isActivate: !contract.isActive,
                            })
                          }
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                            contract.isActive
                              ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40'
                          }`}
                          title={contract.isActive ? 'Deactivate Contract' : 'Activate Contract'}
                        >
                          {contract.isActive ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* الترقيم (Pagination) */}
          <div className="pt-2">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filteredContracts.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {/* Create / Edit Contract Modal (Super Admin only) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContract ? 'Edit Works Package' : 'Create New Works Package'}
        description="Configure package details under an active engineering project."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-4"
        >
          {!editingContract && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Parent Project *
              </label>
              <Select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Select project..."
              >
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectCode} — {p.projectName}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Contract Code * (e.g. CTR01)
            </label>
            <Input
              required
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value)}
              placeholder="e.g. CTR01"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Contract Name *
            </label>
            <Input
              required
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="e.g. Works Package A - Foundations & Structure"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saveMutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editingContract ? t('saveChanges') : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Confirmation Dialog (Super Admin only) */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, contract: null, isActivate: false })}
        onConfirm={() => {
          if (confirmDialog.contract) {
            toggleStatusMutation.mutate({
              id: confirmDialog.contract.contractId,
              isActivate: confirmDialog.isActivate,
            })
          }
        }}
        title={confirmDialog.isActivate ? t('activate') : t('deactivate')}
        message={`Are you sure you want to ${
          confirmDialog.isActivate ? t('activate').toLowerCase() : t('deactivate').toLowerCase()
        } ${confirmDialog.contract?.contractName}?`}
        confirmText={confirmDialog.isActivate ? t('activate') : t('deactivate')}
        isDestructive={!confirmDialog.isActivate}
        isLoading={toggleStatusMutation.isPending}
      />
    </div>
  )
}

export default ContractsPage