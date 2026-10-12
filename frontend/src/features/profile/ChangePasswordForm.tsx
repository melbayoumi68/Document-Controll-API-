import React, { useState } from 'react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { KeyRound, Eye, EyeOff } from 'lucide-react'

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [errors, setErrors] = useState<{ current?: string; newPassword?: string; confirm?: string }>({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}

    if (!currentPassword) errs.current = 'Current password is required.'
    if (!newPassword || newPassword.length < 6) {
      errs.newPassword = 'New password must be at least 6 characters.'
    }
    if (newPassword !== confirmPassword) {
      errs.confirm = 'Passwords do not match.'
    }
    if (newPassword && newPassword === currentPassword) {
      errs.newPassword = 'New password must differ from the current password.'
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await authService.changeMyPassword({ currentPassword, newPassword })
      toast.success('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onSuccess?.()
    } catch {
      // Error toast handled by the axios interceptor
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
          Current Password *
        </label>
        <div className="relative">
          <Input
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.current && (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.current}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
            New Password *
          </label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.newPassword}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
            Confirm New Password *
          </label>
          <Input
            type={showNew ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat the new password"
            autoComplete="new-password"
          />
          {errors.confirm && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {errors.confirm}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={saving}
          leftIcon={<KeyRound className="h-4 w-4" />}
          disabled={saving}
        >
          Update Password
        </Button>
      </div>
    </form>
  )
}
