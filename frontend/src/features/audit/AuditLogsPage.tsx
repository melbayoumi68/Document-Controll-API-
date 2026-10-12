import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogsApi, usersApi } from '@/api'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { Search, ShieldCheck, Activity, UserCheck, FileText, Lock } from 'lucide-react'

export const AuditLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogsApi.getAll(),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  })

  const formatCustomDate = (dateString: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false 
    }
    return date.toLocaleString('en-US', options).replace(',', '')
  }

  const filteredLogs = logs
    .slice()
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false
      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      )
    })

  useEffect(() => {
    setPage(1)
  }, [searchQuery, actionFilter, entityFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedLogs = filteredLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Submit':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">
            {action}
          </span>
        )
      case 'UploadVersion':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            {action}
          </span>
        )
      case 'Review':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800">
            {action}
          </span>
        )
      case 'LoginSuccess':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
            {action}
          </span>
        )
      case 'Activate':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            {action}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {action}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Immutable Audit Trail"
        description="Comprehensive compliance logs capturing all submittals, revisions, reviews, and system modifications."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Audit Trail' }]}
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Audit Logs</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{logs.length}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Users Monitored</p>
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{users.length}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Security Status</p>
            <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure & Protected
            </h4>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search audit details or actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-white dark:bg-slate-950 text-xs h-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-44 text-xs bg-white dark:bg-slate-950 h-10"
          >
            <option value="ALL">All Actions</option>
            <option value="Submit">Submit</option>
            <option value="UploadVersion">UploadVersion</option>
            <option value="Review">Review</option>
            <option value="LoginSuccess">LoginSuccess</option>
            <option value="Activate">Activate</option>
            <option value="Create">Create</option>
            <option value="Update">Update</option>
          </Select>

          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full sm:w-44 text-xs bg-white dark:bg-slate-950 h-10"
          >
            <option value="ALL">All Entities</option>
            <option value="Document">Document</option>
            <option value="DocumentVersion">DocumentVersion</option>
            <option value="ConsultantReview">ConsultantReview</option>
            <option value="Contract">Contract</option>
            <option value="Project">Project</option>
            <option value="User">User</option>
          </Select>
        </div>
      </div>

      {/* Main Data Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden rounded-xl bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<ShieldCheck className="w-10 h-10 text-blue-500" />}
                title="No audit entries found"
                description="Actions performed in the system will automatically be audited and logged here."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Action</th>
                      <th className="py-4 px-6">Entity</th>
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {pagedLogs.map((log) => {
                      const actor = users.find((u) => u.userId === log.userId)
                      return (
                        <tr
                          key={log.auditLogId}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* تم إزالة font-mono لتصبح الكتابة ناعمة وطبيعية */}
                          <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                            {formatCustomDate(log.timestamp)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">{getActionBadge(log.action)}</td>
                          <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              {log.entityType} <span className="text-blue-600 dark:text-blue-400 font-semibold">#{log.entityId}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {actor ? actor.fullName : log.userId ? `User #${log.userId}` : 'System'}
                          </td>
                          {/* تحسين مظهر التفاصيل وإزالة الخط البرمجي الحاد */}
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-400 text-xs max-w-md truncate">
                            {log.details || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  total={filteredLogs.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}