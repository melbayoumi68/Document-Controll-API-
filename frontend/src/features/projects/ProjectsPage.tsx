import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  projectsApi,
  contractsApi,
  contractAssignmentsApi,
  usersApi,
} from '@/api'
import { useUserStore } from '@/stores'
import { Project, Roles } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { formatDate } from '@/lib/utils'
import {
  PlusCircle,
  Edit,
  Power,
  PowerOff,
  Briefcase,
  Search,
  UserCheck,
  Eye,
  HardHat,
  Trash2,
  Layers,
  Sparkles,
  Building2,
  MapPin,
  TrendingUp,
  Filter,
  CheckCircle2,
  Compass,
} from 'lucide-react'
import { toast } from 'sonner'

export const ProjectsPage: React.FC = () => {
  const { t } = useTranslation()
  const { isSuperAdmin } = useUserStore()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [regionFilter, setRegionFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)

  // Create / Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [region, setRegion] = useState('')
  const [description, setDescription] = useState('')

  // View modal
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignProject, setAssignProject] = useState<Project | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  const [selectedEngineerId, setSelectedEngineerId] = useState('')
  const [selectedConsultantId, setSelectedConsultantId] = useState('')

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    project: Project | null
    isActivate: boolean
  }>({ open: false, project: null, isActivate: false })

  // Permanent delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    project: Project | null
  }>({ open: false, project: null })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
  })

  // --- Assign modal data (only when open) ---
  const assignProjectId = assignProject?.projectId ?? 0

  const { data: assignContracts = [], isLoading: assignContractsLoading } = useQuery({
    queryKey: ['contracts', 'by-project', assignProjectId],
    queryFn: () => contractsApi.getByProject(assignProjectId),
    enabled: assignModalOpen && assignProjectId > 0,
  })

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['contract-assignments', selectedContractId],
    queryFn: () => contractAssignmentsApi.getByContractId(selectedContractId!),
    enabled: assignModalOpen && !!selectedContractId,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => usersApi.getAll(true),
    enabled: assignModalOpen && !!selectedContractId,
  })

  const engineers = users.filter((u) => u.role === Roles.ToEngineer)
  const consultants = users.filter((u) => u.role === Roles.Consultant)
  const selectedContract =
    assignContracts.find((c) => c.contractId === selectedContractId) || null

  // =========================================================================
  // تحليلات محفظة المشاريع (Projects Portfolio Analytics)
  // =========================================================================
  const analytics = useMemo(() => {
    const totalProjects = projects.length
    const activeProjects = projects.filter((p) => p.isActive).length
    const inactiveProjects = totalProjects - activeProjects
    const totalPackages = projects.reduce((acc, p) => acc + (p.contractsCount ?? 0), 0)

    // جمع المناطق المميزة
    const regions = Array.from(
      new Set(projects.map((p) => p.region?.trim()).filter(Boolean))
    ) as string[]

    const avgPackages =
      totalProjects > 0 ? (totalPackages / totalProjects).toFixed(1) : '0'

    return {
      totalProjects,
      activeProjects,
      inactiveProjects,
      totalPackages,
      regions,
      avgPackages,
      activeRate: totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0,
    }
  }, [projects])

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingProject(null)
    setProjectName('')
    setProjectCode('')
    setRegion('')
    setDescription('')
    setEditModalOpen(true)
  }

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p)
    setProjectName(p.projectName)
    setProjectCode(p.projectCode)
    setRegion(p.region || '')
    setDescription(p.description || '')
    setEditModalOpen(true)
  }

  const handleOpenView = (p: Project) => {
    setViewingProject(p)
    setViewModalOpen(true)
  }

  const handleOpenAssign = (p: Project) => {
    setAssignProject(p)
    setSelectedContractId(null)
    setSelectedEngineerId('')
    setSelectedConsultantId('')
    setAssignModalOpen(true)
  }

  const closeAssignModal = () => {
    setAssignModalOpen(false)
    setAssignProject(null)
    setSelectedContractId(null)
    setSelectedEngineerId('')
    setSelectedConsultantId('')
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingProject) {
        return await projectsApi.update(editingProject.projectId, {
          projectName: projectName.trim(),
          projectCode: projectCode.trim(),
          region: region.trim() || undefined,
          description: description.trim() || undefined,
        })
      }
      return await projectsApi.create({
        projectName: projectName.trim(),
        projectCode: projectCode.trim(),
        region: region.trim() || undefined,
        description: description.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success(editingProject ? 'Project updated!' : 'Project created!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditModalOpen(false)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActivate }: { id: number; isActivate: boolean }) => {
      if (isActivate) await projectsApi.activate(id)
      else await projectsApi.deactivate(id)
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActivate ? 'Project activated!' : 'Project deactivated!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setConfirmDialog({ open: false, project: null, isActivate: false })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      toast.success('Project and all related data deleted.')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setDeleteDialog({ open: false, project: null })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete project.'
      toast.error(msg)
    },
  })

  const assignEngMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!selectedContract || !assignProject) throw new Error('Missing contract/project')
      return await contractAssignmentsApi.assignEngineer({
        contractId: selectedContract.contractId,
        projectId: selectedContract.projectId || assignProject.projectId,
        userId,
      })
    },
    onSuccess: () => {
      toast.success('Engineer assigned!')
      setSelectedEngineerId('')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'by-project', assignProjectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const assignConsMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!selectedContract || !assignProject) throw new Error('Missing contract/project')
      return await contractAssignmentsApi.assignConsultant({
        contractId: selectedContract.contractId,
        projectId: selectedContract.projectId || assignProject.projectId,
        userId,
      })
    },
    onSuccess: () => {
      toast.success('Consultant assigned!')
      setSelectedConsultantId('')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'by-project', assignProjectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const removeEngMutation = useMutation({
    mutationFn: (assignmentId: number) => contractAssignmentsApi.removeEngineer(assignmentId),
    onSuccess: () => {
      toast.success('Engineer removed.')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'by-project', assignProjectId] })
    },
  })

  const removeConsMutation = useMutation({
    mutationFn: (assignmentId: number) => contractAssignmentsApi.removeConsultant(assignmentId),
    onSuccess: () => {
      toast.success('Consultant removed.')
      queryClient.invalidateQueries({ queryKey: ['contract-assignments', selectedContractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'by-project', assignProjectId] })
    },
  })

  // الفلترة والبحث
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // بحث نصي
      const matchesSearch =
        !searchQuery.trim() ||
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.region && p.region.toLowerCase().includes(searchQuery.toLowerCase()))

      // فلترة الحالة
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && p.isActive) ||
        (statusFilter === 'INACTIVE' && !p.isActive)

      // فلترة المنطقة
      const matchesRegion =
        regionFilter === 'ALL' || p.region?.trim() === regionFilter

      return matchesSearch && matchesStatus && matchesRegion
    })
  }, [projects, searchQuery, statusFilter, regionFilter])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, regionFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedProjects = filteredProjects.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  return (
    <div className="space-y-7 pb-14">
      {/* =========================================================
          1. ترويسة الصفحة (Page Header) بنفس ستايل الداشبورد
      ========================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151c28] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Building2 className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Engineering Projects Portfolio
            </h1>
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Master project structures governing construction packages and submittal coding sequences.
          </p>
        </div>

        {isSuperAdmin() && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* =========================================================
          2. شريط التحليلات السريعة للمشاريع (Portfolio Analytics KPIs)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Master Projects
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.totalProjects}
              </h3>
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {analytics.activeProjects} Active ({analytics.activeRate}%)
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400">
              <Layers className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Work Packages */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Work Packages / Contracts
              </p>
              <h3 className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics.totalPackages}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Avg {analytics.avgPackages} packages / project
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Active Locations / Regions */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Geographic Regions
              </p>
              <h3 className="mt-1 text-3xl font-black text-cyan-600 dark:text-cyan-400">
                {analytics.regions.length || 1}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {analytics.regions.join(', ') || 'Nationwide Projects'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-600 group-hover:text-white dark:bg-cyan-950/60 dark:text-cyan-400">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Supervision & Governance */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Governance & Standards
              </p>
              <h3 className="mt-1 text-xl font-black text-indigo-600 dark:text-indigo-400">
                PRJ / TYPE
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Strict Submittal Syntax Enforcement
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400">
              <Compass className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. شريط البحث والفلترة الذكي (Smart Filters Bar)
      ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#151c28]">
        {/* حقل البحث بالاسم والكود */}
        <div className="relative min-w-[260px] flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search projects by code, title, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/70 ps-10 pe-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>

        {/* فلاتر الحالة والمناطق */}
        <div className="flex flex-wrap items-center gap-2">
          {/* فلتر الحالة */}
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Active ({analytics.activeProjects})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'INACTIVE'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Inactive ({analytics.inactiveProjects})
            </button>
          </div>

          {/* فلتر المنطقة */}
          {analytics.regions.length > 0 && (
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-9 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Regions</option>
              {analytics.regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* =========================================================
          4. شبكة كروت المشاريع (Executive Project Cards)
      ========================================================= */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-60 w-full rounded-3xl" />
          <Skeleton className="h-60 w-full rounded-3xl" />
          <Skeleton className="h-60 w-full rounded-3xl" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title={t('noProjects')}
          description="No engineering projects match your search or filter criteria."
          action={
            isSuperAdmin() && (
              <Button size="sm" onClick={handleOpenCreate}>
                Create Project
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pagedProjects.map((project) => (
              <div
                key={project.projectId}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#151c28] dark:hover:border-blue-900"
              >
                {/* رأس الكارت */}
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-blue-50 px-2.5 py-1 font-mono text-xs font-black tracking-wider text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                        {project.projectCode}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        project.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          project.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* اسم ووصف المشروع */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {project.projectName}
                    </h3>

                    {project.region && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                        <MapPin className="h-3 w-3 text-cyan-500" />
                        Region: <span className="font-semibold text-slate-600 dark:text-slate-300">{project.region}</span>
                      </p>
                    )}

                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {project.description || 'No detailed scope description provided.'}
                    </p>
                  </div>
                </div>

                {/* مؤشرات حزم الأعمال وتاريخ الإنشاء */}
                <div className="mt-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 p-3 text-xs dark:bg-slate-900/50">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                      <strong>{project.contractsCount ?? 0}</strong> Packages
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  {/* أزرار الإجراءات السريعة في الكارت */}
                  {isSuperAdmin() && (
                    <div className="mt-3.5 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <button
                        onClick={() => handleOpenView(project)}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenAssign(project)}
                        className="inline-flex h-8 items-center gap-1 rounded-full bg-blue-50 px-3.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600"
                      >
                        <UserCheck className="h-3 w-3" />
                        <span>Assign</span>
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            project,
                            isActivate: !project.isActive,
                          })
                        }
                        className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${
                          project.isActive
                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {project.isActive ? (
                          <>
                            <PowerOff className="h-3 w-3" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <Power className="h-3 w-3" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteDialog({ open: true, project })}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* الترقيم (Pagination) */}
          <div className="pt-2">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filteredProjects.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {/* ========== VIEW MODAL ========== */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setViewingProject(null)
        }}
        title="Project Summary"
        description="Read-only overview of the selected engineering project."
        size="md"
      >
        {viewingProject && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-black tracking-wider text-blue-600 dark:text-blue-400">
                  {viewingProject.projectCode}
                </p>
                <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {viewingProject.projectName}
                </h4>
              </div>
              <Badge variant={viewingProject.isActive ? 'success' : 'secondary'}>
                {viewingProject.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850/40">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Region
                </dt>
                <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  {viewingProject.region || '—'}
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850/40">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Packages
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                  {viewingProject.contractsCount ?? 0} Packages
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850/40">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Created
                </dt>
                <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(viewingProject.createdAt)}
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-850/40">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </dt>
                <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  {viewingProject.isActive ? 'Active' : 'Inactive'}
                </dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Description
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {viewingProject.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  setViewModalOpen(false)
                  setViewingProject(null)
                }}
              >
                Close
              </Button>
              {isSuperAdmin() && (
                <>
                  <Button
                    variant="outline"
                    leftIcon={<Edit className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setViewModalOpen(false)
                      handleOpenEdit(viewingProject)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="primary"
                    leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setViewModalOpen(false)
                      handleOpenAssign(viewingProject)
                    }}
                  >
                    Assign
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ========== CREATE / EDIT MODAL ========== */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingProject ? t('editProject') : t('createProject')}
        description="Configure project master record used for 6-part document numbering."
        size="md"
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
              Project Code * (e.g. PRJ22)
            </label>
            <Input
              required
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              placeholder="e.g. PRJ22"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Project Name *
            </label>
            <Input
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Port Said Sewerage Network Upgrade"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Region / Location
            </label>
            <Input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. North Sector, Port Said"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project engineering scope and details..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editingProject ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== ASSIGN MODAL ========== */}
      <Modal
        isOpen={assignModalOpen}
        onClose={closeAssignModal}
        title={
          assignProject
            ? `Assign Roles to Project: ${assignProject.projectName}`
            : 'Assign Users'
        }
        description="Select a work package in this project, then assign Technical Engineers and Consultants."
        size="xl"
      >
        {assignProject && (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto pe-1">
            {/* Project chip */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-850/40">
              <Layers className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {assignProject.projectCode}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {assignProject.projectName}
              </span>
              {assignProject.region && (
                <span className="text-slate-500">Region: {assignProject.region}</span>
              )}
              <Badge variant={assignProject.isActive ? 'success' : 'secondary'}>
                {assignProject.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Step 1: Contract select */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                1. Select Contract Package
              </label>
              {assignContractsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : assignContracts.length === 0 ? (
                <EmptyState
                  title="No contracts in this project"
                  description="Create contract packages for this project first before assigning engineers."
                />
              ) : (
                <Select
                  value={selectedContractId?.toString() ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setSelectedContractId(v ? Number(v) : null)
                    setSelectedEngineerId('')
                    setSelectedConsultantId('')
                  }}
                  placeholder="Choose a contract package..."
                >
                  {assignContracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.contractCode} — {c.contractName || 'Unnamed'}
                      {c.isActive ? '' : ' (Inactive)'}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Step 2 + 3: Current assignments + dropdowns */}
            {selectedContractId && selectedContract && (
              <>
                {assignmentsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Engineers */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Technical Engineer (Contractor)
                        </h4>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
                          Assign Engineer
                        </label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedEngineerId}
                            onChange={(e) => setSelectedEngineerId(e.target.value)}
                            placeholder="Select engineer..."
                            className="text-xs"
                          >
                            {engineers.map((eng) => (
                              <option key={eng.userId} value={eng.userId}>
                                {eng.fullName} ({eng.email})
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={!selectedEngineerId || assignEngMutation.isPending}
                            isLoading={assignEngMutation.isPending}
                            onClick={() =>
                              assignEngMutation.mutate(parseInt(selectedEngineerId, 10))
                            }
                          >
                            Assign
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                          Current Assigned Engineers
                        </p>
                        {!assignments?.engineers?.length ? (
                          <p className="text-xs italic text-slate-400">
                            No engineers assigned to this package yet.
                          </p>
                        ) : (
                          assignments.engineers.map((a) => {
                            const userObj = users.find((u) => u.userId === a.userId)
                            return (
                              <div
                                key={a.contractEngineerId}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {userObj?.fullName || `User #${a.userId}`}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatDate(a.assignedAt)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeEngMutation.mutate(a.contractEngineerId)
                                  }
                                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                                  title="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Consultants */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Supervising Consultant
                        </h4>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
                          Assign Consultant
                        </label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedConsultantId}
                            onChange={(e) => setSelectedConsultantId(e.target.value)}
                            placeholder="Select consultant..."
                            className="text-xs"
                          >
                            {consultants.map((cons) => (
                              <option key={cons.userId} value={cons.userId}>
                                {cons.fullName} ({cons.email})
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={!selectedConsultantId || assignConsMutation.isPending}
                            isLoading={assignConsMutation.isPending}
                            onClick={() =>
                              assignConsMutation.mutate(parseInt(selectedConsultantId, 10))
                            }
                          >
                            Assign
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                          Current Assigned Consultants
                        </p>
                        {!assignments?.consultants?.length ? (
                          <p className="text-xs italic text-slate-400">
                            No consultants assigned to this package yet.
                          </p>
                        ) : (
                          assignments.consultants.map((c) => {
                            const userObj = users.find((u) => u.userId === c.userId)
                            return (
                              <div
                                key={c.contractConsultantId}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {userObj?.fullName || `User #${c.userId}`}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatDate(c.assignedAt)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeConsMutation.mutate(c.contractConsultantId)
                                  }
                                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-700"
                                  title="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!selectedContractId && assignContracts.length > 0 && (
              <p className="py-2 text-center text-sm text-slate-500">
                Select a contract package above to manage Engineer and Consultant assignments.
              </p>
            )}

            <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-slate-800">
              <Button variant="outline" onClick={closeAssignModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Activate / Deactivate confirm */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, project: null, isActivate: false })}
        onConfirm={() => {
          if (confirmDialog.project) {
            toggleStatusMutation.mutate({
              id: confirmDialog.project.projectId,
              isActivate: confirmDialog.isActivate,
            })
          }
        }}
        title={confirmDialog.isActivate ? 'Activate Project' : 'Deactivate Project'}
        message={`Are you sure you want to ${
          confirmDialog.isActivate ? 'activate' : 'deactivate'
        } ${confirmDialog.project?.projectName}?`}
        confirmText={confirmDialog.isActivate ? 'Activate' : 'Deactivate'}
        isDestructive={!confirmDialog.isActivate}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Permanent delete confirm */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, project: null })}
        onConfirm={() => {
          if (deleteDialog.project) {
            deleteMutation.mutate(deleteDialog.project.projectId)
          }
        }}
        title="Delete Project"
        message={`Delete "${deleteDialog.project?.projectName}" and EVERYTHING under it (contracts, documents, versions, reviews)? This cannot be undone.`}
        confirmText="Delete permanently"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default ProjectsPage