import React from 'react'
import { useUserStore } from '@/stores'
import { authService } from '@/services/authService'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChangePasswordForm } from '@/features/profile/ChangePasswordForm'
import { Shield, HardHat, Briefcase, Mail, User as UserIcon, Hash } from 'lucide-react'
import { Roles } from '@/types'

const roleMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  [Roles.SuperAdmin]: {
    label: 'Super Admin',
    icon: <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
  },
  [Roles.ToEngineer]: {
    label: 'Technical Office Engineer',
    icon: <HardHat className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
  },
  [Roles.Consultant]: {
    label: 'Consultant',
    icon: <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  },
}

export const ProfilePage: React.FC = () => {
  const { currentUser } = useUserStore()
  const user = authService.getCurrentUser()
  const display = user || currentUser
  const meta = display?.role ? roleMeta[display.role] : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account details and password settings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-blue-600" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                {(display?.fullName || display?.username || '?')
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {display?.fullName || '—'}
                </p>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {meta?.icon}
                  {meta?.label || display?.role || '—'}
                </p>
              </div>
            </div>

            <dl className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <UserIcon className="h-3.5 w-3.5" />
                  Username
                </dt>
                <dd className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {display?.username || '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </dt>
                <dd className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {display?.email || '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Hash className="h-3.5 w-3.5" />
                  User ID
                </dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {display?.userId ?? '—'}
                </dd>
              </div>
            </dl>

            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              Your permissions and data scope are enforced by the server based on
              your role and contract assignments.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-blue-600" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
