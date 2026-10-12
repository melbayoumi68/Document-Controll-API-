import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api'
import { useUserStore, useUIStore } from '@/stores'
import { X, Bell, Check, Clock, AlertCircle } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export const NotificationsDrawer: React.FC = () => {
  const { currentUser } = useUserStore()
  const { notificationsOpen, setNotificationsOpen } = useUIStore()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'my'],
    queryFn: () =>
      currentUser ? notificationsApi.getMy() : Promise.resolve([] as never),
    enabled: !!currentUser && notificationsOpen,
    refetchInterval: notificationsOpen ? 10000 : false,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })

  if (!notificationsOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => setNotificationsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-xs text-slate-500">
                  {currentUser ? `For ${currentUser.fullName}` : 'No active user'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No notifications
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-3.5 rounded-xl border transition-all ${
                    n.isRead
                      ? 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!n.isRead ? (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold leading-snug">{n.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {n.message}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                    {n.documentId ? (
                      <Link
                        to={`/documents/${n.documentId}`}
                        onClick={() => {
                          if (!n.isRead) markReadMutation.mutate(n.notificationId)
                          setNotificationsOpen(false)
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        View Document →
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!n.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(n.notificationId)}
                        disabled={markReadMutation.isPending}
                        className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
