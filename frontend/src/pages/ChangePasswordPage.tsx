import React from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { ChangePasswordForm } from '@/features/profile/ChangePasswordForm'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUserStore } from '@/stores'

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useUserStore()
  const user = authService.getCurrentUser()
  const mustSetPassword = user?.mustSetPassword

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {mustSetPassword ? 'Password Setup Required' : 'Change Password'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mustSetPassword
              ? `Hello ${user?.fullName || user?.username}. Please set a new password before continuing.`
              : 'Update your account password. You will stay signed in after the change.'}
          </p>
        </div>

        <ChangePasswordForm
          onSuccess={() => {
            if (mustSetPassword) {
              navigate('/dashboard', { replace: true })
            }
          }}
        />

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          {!mustSetPassword && (
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="w-full"
            >
              Back to Profile
            </Button>
          )}
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => {
              authService.logout()
              navigate('/login', { replace: true })
            }}
            className="w-full"
          >
            Sign Out{currentUser ? ` (${currentUser.username})` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPage
