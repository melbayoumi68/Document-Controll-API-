import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api'
import { useUserStore } from '@/stores'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatTimeAgo, formatDateTime } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Bell, Check, Clock, Trash2, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useUserStore()
  const queryClient = useQueryClient()
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [filterUnreadOnly, pageSize])

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'my'],
    queryFn: () =>
      currentUser ? notificationsApi.getMy() : Promise.resolve([] as never),
    enabled: !!currentUser,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.isRead)
      await Promise.all(unread.map((n) => notificationsApi.markAsRead(n.notificationId)))
    },
    onSuccess: () => {
      toast.success('All marked as read!')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const filtered = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Real-time alerts on document submissions, approvals, review remarks, and workflow events."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
            >
              Mark all as read
            </Button>
          )
        }
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterUnreadOnly(false)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            !filterUnreadOnly
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterUnreadOnly(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            filterUnreadOnly
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-8 h-8 text-slate-400" />}
              title="No notifications"
              description={
                filterUnreadOnly
                  ? 'You have read all of your notifications.'
                  : 'You have no notifications yet.'
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {paged.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    n.isRead
                      ? 'bg-white dark:bg-slate-900 opacity-80'
                      : 'bg-blue-50/40 dark:bg-blue-950/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {n.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      {formatTimeAgo(n.createdAt)} • {formatDateTime(n.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {n.documentId && (
                      <Link to={`/documents/${n.documentId}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          onClick={() => {
                            if (!n.isRead) markReadMutation.mutate(n.notificationId)
                          }}
                        >
                          View Document
                        </Button>
                      </Link>
                    )}

                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        onClick={() => markReadMutation.mutate(n.notificationId)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
