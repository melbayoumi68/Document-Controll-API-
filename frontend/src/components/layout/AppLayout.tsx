import React from 'react'
import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { NotificationsDrawer } from './NotificationsDrawer'
import { CommandPalette } from './CommandPalette'
import { SubmitReviewModal } from '@/features/reviews/SubmitReviewModal'

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <NotificationsDrawer />
      <CommandPalette />
      <SubmitReviewModal />
    </div>
  )
}
