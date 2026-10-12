import React, { useEffect, useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, departmentsApi } from '@/api'
import { useUserStore } from '@/stores'
import { User, Roles, RoleType } from '@/types'
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
import {
  PlusCircle,
  Users,
  KeyRound,
  Edit,
  Search,
  Shield,
  Briefcase,
  HardHat,
  Mail,
  UserCheck,
  UserX,
  Trash2,
  Building2,
  ShieldCheck,
  Sparkles,
  Compass,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

export const UsersPage: React.FC = () => {
  const { isSuperAdmin } = useUserStore()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)

  // Modals States
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Form states for Create/Edit
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<RoleType>(Roles.ToEngineer)
  const [departmentId, setDepartmentId] = useState<string>('')

  // Confirm dialog for status toggle
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: User | null
    isActivate: boolean
  }>({
    open: false,
    user: null,
    isActivate: false,
  })

  // Confirm dialog for delete
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    user: User | null
  }>({
    open: false,
    user: null,
  })

  // Queries
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getAll(true),
  })

  // =========================================================================
  // تحليلات المستخدمين والهيكل الهندسي (User Matrix Analytics)
  // =========================================================================
  const analytics = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.isActive).length
    const engineersCount = users.filter((u) => u.role === Roles.ToEngineer).length
    const consultantsCount = users.filter((u) => u.role === Roles.Consultant).length
    const adminsCount = users.filter((u) => u.role === Roles.SuperAdmin).length

    const activeRate =
      totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

    return {
      totalUsers,
      activeUsers,
      engineersCount,
      consultantsCount,
      adminsCount,
      activeRate,
    }
  }, [users])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setUsername('')
    setEmail('')
    setPassword('')
    setFullName('')
    setRole(Roles.ToEngineer)
    setDepartmentId('')
    setModalOpen(true)
  }

  const handleOpenEdit = (u: User) => {
    setEditingUser(u)
    setUsername(u.username)
    setEmail(u.email)
    setFullName(u.fullName)
    setRole(u.role)
    setDepartmentId(u.departmentId?.toString() || '')
    setModalOpen(true)
  }

  const handleOpenPassword = (u: User) => {
    setSelectedUserForPassword(u)
    setNewPassword('')
    setPasswordModalOpen(true)
  }

  // Create / Edit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        return await usersApi.update(editingUser.userId, {
          email: email.trim(),
          fullName: fullName.trim(),
          role,
          departmentId: departmentId ? parseInt(departmentId, 10) : null,
          isActive: editingUser.isActive,
        })
      } else {
        return await usersApi.create({
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          role,
          departmentId: departmentId ? parseInt(departmentId, 10) : null,
        })
      }
    },
    onSuccess: () => {
      toast.success(
        editingUser
          ? 'User updated successfully!'
          : 'User created successfully!'
      )
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Operation failed')
    },
  })

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserForPassword) {
        throw new Error('No user selected')
      }

      await usersApi.changePassword(selectedUserForPassword.userId, {
        newPassword: newPassword.trim(),
      })
    },
    onSuccess: () => {
      toast.success('Password changed successfully!')
      setPasswordModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to change password')
    },
  })

  // Activate / Deactivate Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      isActivate,
    }: {
      id: number
      isActivate: boolean
    }) => {
      if (isActivate) {
        await usersApi.activate(id)
      } else {
        await usersApi.deactivate(id)
      }
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.isActivate
          ? 'User activated successfully!'
          : 'User deactivated successfully!'
      )

      queryClient.invalidateQueries({ queryKey: ['users'] })

      setConfirmDialog({
        open: false,
        user: null,
        isActivate: false,
      })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Status update failed')
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await usersApi.delete(id)
    },
    onSuccess: () => {
      toast.success('User deleted successfully!')

      queryClient.invalidateQueries({ queryKey: ['users'] })

      setDeleteDialog({
        open: false,
        user: null,
      })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete user')
    },
  })

  const getRoleConfig = (r: string) => {
    switch (r) {
      case Roles.SuperAdmin:
        return {
          label: 'Super Admin',
          icon: <Shield className="h-3.5 w-3.5" />,
          badge:
            'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
          avatarBg: 'bg-purple-600 text-white shadow-purple-600/30',
        }

      case Roles.ToEngineer:
        return {
          label: 'Technical Engineer',
          icon: <HardHat className="h-3.5 w-3.5" />,
          badge:
            'bg-cyan-50 text-cyan-700 border border-cyan-200/80 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60',
          avatarBg: 'bg-cyan-600 text-white shadow-cyan-600/30',
        }

      case Roles.Consultant:
        return {
          label: 'Consultant',
          icon: <Compass className="h-3.5 w-3.5" />,
          badge:
            'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
          avatarBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
        }

      default:
        return {
          label: r,
          icon: <Users className="h-3.5 w-3.5" />,
          badge: 'bg-slate-100 text-slate-700 border border-slate-200',
          avatarBg: 'bg-blue-600 text-white shadow-blue-600/30',
        }
    }
  }

  // التصفية والبحث
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false
      }

      if (statusFilter === 'ACTIVE' && !u.isActive) return false
      if (statusFilter === 'INACTIVE' && u.isActive) return false

      if (!searchQuery.trim()) {
        return true
      }

      const q = searchQuery.toLowerCase()

      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
  }, [users, roleFilter, statusFilter, searchQuery])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, roleFilter, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedUsers = filteredUsers.slice(
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
              <Users className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              User Accounts & RBAC Matrix
            </h1>
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Role-based access matrix governing technical engineers, supervising consultants, and system administrators.
          </p>
        </div>

        {isSuperAdmin() && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* =========================================================
          2. شريط تحليلات المستخدمين (User Accounts KPIs)
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total System Accounts
              </p>
              <h3 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {analytics.totalUsers}
              </h3>
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {analytics.activeUsers} Active ({analytics.activeRate}%)
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Technical Engineers */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Technical Engineers
              </p>
              <h3 className="mt-1 text-3xl font-black text-cyan-600 dark:text-cyan-400">
                {analytics.engineersCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Document Submittal Originators</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-600 group-hover:text-white dark:bg-cyan-950/60 dark:text-cyan-400">
              <HardHat className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Consultants */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Supervising Consultants
              </p>
              <h3 className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics.consultantsCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Reviewers & Approvers</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400">
              <Compass className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Super Admins */}
        <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-[#151c28]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Super Admins
              </p>
              <h3 className="mt-1 text-3xl font-black text-purple-600 dark:text-purple-400">
                {analytics.adminsCount}
              </h3>
              <p className="mt-1 text-xs text-slate-400">Security & RBAC Governance</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-950/60 dark:text-purple-400">
              <ShieldCheck className="h-6 w-6" />
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
            placeholder="Quick search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/70 ps-10 pe-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Search className="pointer-events-none absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>

        {/* فلاتر الأدوار والحالة */}
        <div className="flex flex-wrap items-center gap-2">
          {/* فلتر الأدوار */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">✨ All System Roles ({users.length})</option>
            <option value={Roles.ToEngineer}>
              Technical Engineers ({analytics.engineersCount})
            </option>
            <option value={Roles.Consultant}>
              Consultants ({analytics.consultantsCount})
            </option>
            <option value={Roles.SuperAdmin}>
              Super Admins ({analytics.adminsCount})
            </option>
          </select>

          {/* فلتر الحالة السريع */}
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'INACTIVE'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. شبكة كروت المستخدمين (Executive User Cards)
      ========================================================= */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-blue-500" />}
          title="No user accounts discovered"
          description="Try adjusting your search query or role filter, or create a new system operator."
          action={
            isSuperAdmin() && (
              <Button size="sm" onClick={handleOpenCreate}>
                Add First User
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pagedUsers.map((u) => {
              const dept = departments.find((d) => d.departmentId === u.departmentId)
              const roleConf = getRoleConfig(u.role)

              return (
                <div
                  key={u.userId}
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-800 dark:bg-[#151c28] dark:hover:border-blue-900"
                >
                  {/* رأس الكارت */}
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        {/* الأفاتار الدائري بالحرف الأول */}
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black text-sm shadow-md ${roleConf.avatarBg}`}
                        >
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {u.fullName}
                          </h3>
                          <span className="font-mono text-xs text-slate-400">
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* تفاصيل الرتبة والبريد والقسم */}
                    <div className="my-4 space-y-2.5">
                      {/* بادج الرتبة الهندسية */}
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleConf.badge}`}
                      >
                        {roleConf.icon}
                        <span>{roleConf.label}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2 text-[11px] font-semibold text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-blue-500" />
                          <span>Dept:</span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {dept?.name || 'Technical Office'}
                          </strong>
                        </span>

                        <span className="font-mono text-[10px] text-slate-400">
                          Joined: {formatDate(u.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* شريط الإجراءات السفلية الكبسولية */}
                  <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenPassword(u)}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <KeyRound className="h-3 w-3 text-slate-400" />
                      <span>Password</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Edit className="h-3 w-3 text-slate-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          user: u,
                          isActivate: !u.isActive,
                        })
                      }
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                        u.isActive
                          ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40'
                      }`}
                      title={u.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {u.isActive ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          user: u,
                        })
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      title="Delete User"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* الترقيم (Pagination) */}
          <div className="pt-2">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filteredUsers.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </>
      )}

      {/* ========== CREATE / EDIT USER MODAL ========== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Create New User Account'}
        description="Configure account credentials and engineering role permissions."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-4"
        >
          {!editingUser && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Username *
              </label>
              <Input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. eng_ahmed"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Full Name *
            </label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Eng. Ahmed Hassan"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Email Address *
            </label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ahmed@company.com"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Temporary Password *
              </label>
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Role Authority *
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleType)}
            >
              <option value={Roles.ToEngineer}>Technical Engineer (Contractor)</option>
              <option value={Roles.Consultant}>Supervising Consultant</option>
              <option value={Roles.SuperAdmin}>Super Admin (System Governance)</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Engineering Department
            </label>
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">-- No Specific Department --</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saveMutation.isPending}
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== CHANGE PASSWORD MODAL ========== */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Change Password for @${selectedUserForPassword?.username}`}
        description="Set a new secure password for this user."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            passwordMutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              New Password *
            </label>
            <Input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter secure new password"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={passwordMutation.isPending}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog for Activate/Deactivate */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({
            open: false,
            user: null,
            isActivate: false,
          })
        }
        onConfirm={() => {
          if (confirmDialog.user) {
            toggleStatusMutation.mutate({
              id: confirmDialog.user.userId,
              isActivate: confirmDialog.isActivate,
            })
          }
        }}
        title={
          confirmDialog.isActivate
            ? 'Activate User Account'
            : 'Deactivate User Account'
        }
        message={`Are you sure you want to ${
          confirmDialog.isActivate ? 'activate' : 'deactivate'
        } user "${confirmDialog.user?.fullName}"?`}
        confirmText={confirmDialog.isActivate ? 'Activate' : 'Deactivate'}
        isDestructive={!confirmDialog.isActivate}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Confirm Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({
            open: false,
            user: null,
          })
        }
        onConfirm={() => {
          if (deleteDialog.user) {
            deleteMutation.mutate(deleteDialog.user.userId)
          }
        }}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${deleteDialog.user?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

export default UsersPage