import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import {
  RoleRoute,
  SUPER_ADMIN_ONLY,
  ENGINEER_ONLY,
  CONSULTANT_ONLY,
  REVIEWER_ROLES,
} from '@/components/common/RoleRoute'
import { Toaster } from 'sonner'
import { Skeleton } from '@/components/ui/Skeleton'

// Public Pages
const LoginPage = React.lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const ChangePasswordPage = React.lazy(() =>
  import('@/pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage }))
)
const AccessDeniedPage = React.lazy(() =>
  import('@/pages/AccessDeniedPage').then((m) => ({ default: m.AccessDeniedPage }))
)
const NotFoundPage = React.lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

// Shared Pages (all authenticated roles)
const DashboardPage = React.lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const ContractsPage = React.lazy(() =>
  import('@/features/contracts/ContractsPage').then((m) => ({ default: m.ContractsPage }))
)
const DocumentsListPage = React.lazy(() =>
  import('@/features/documents/DocumentsListPage').then((m) => ({
    default: m.DocumentsListPage,
  }))
)
const DocumentDetailPage = React.lazy(() =>
  import('@/features/documents/DocumentDetailPage').then((m) => ({
    default: m.DocumentDetailPage,
  }))
)
const NotificationsPage = React.lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
)
const ProfilePage = React.lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)

// Engineer Pages
const SubmitDocumentPage = React.lazy(() =>
  import('@/features/documents/SubmitDocumentPage').then((m) => ({
    default: m.SubmitDocumentPage,
  }))
)
const UploadVersionPage = React.lazy(() =>
  import('@/features/documents/UploadVersionPage').then((m) => ({
    default: m.UploadVersionPage,
  }))
)
const NeedsRevisionPage = React.lazy(() =>
  import('@/features/documents/NeedsRevisionPage').then((m) => ({
    default: m.NeedsRevisionPage,
  }))
)

// Consultant Pages
const PendingReviewsPage = React.lazy(() =>
  import('@/features/reviews/PendingReviewsPage').then((m) => ({
    default: m.PendingReviewsPage,
  }))
)

// Admin Pages (Super Admin only)
const UsersPage = React.lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage }))
)
const ProjectsPage = React.lazy(() =>
  import('@/features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
)
const ProjectAssignPage = React.lazy(() =>
  import('@/features/projects/ProjectAssignPage').then((m) => ({
    default: m.ProjectAssignPage,
  }))
)
const LookupsPage = React.lazy(() =>
  import('@/features/lookups/LookupsPage').then((m) => ({ default: m.LookupsPage }))
)
const CodingOrderSettingsPage = React.lazy(() =>
  import('@/features/settings/CodingOrderSettingsPage').then((m) => ({
    default: m.CodingOrderSettingsPage,
  }))
)
const AuditLogsPage = React.lazy(() =>
  import('@/features/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))
)

const PageFallback: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
)

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageFallback />}>{element}</Suspense>
)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={withSuspense(<LoginPage />)} />
            <Route path="/change-password" element={withSuspense(<ChangePasswordPage />)} />
            <Route path="/access-denied" element={withSuspense(<AccessDeniedPage />)} />

            {/* Protected System Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Shared */}
              <Route path="dashboard" element={withSuspense(<DashboardPage />)} />
              <Route path="contracts" element={withSuspense(<ContractsPage />)} />
              <Route path="documents" element={withSuspense(<DocumentsListPage />)} />
              <Route path="documents/:id" element={withSuspense(<DocumentDetailPage />)} />
              <Route path="notifications" element={withSuspense(<NotificationsPage />)} />
              <Route path="profile" element={withSuspense(<ProfilePage />)} />

              {/* Engineer routes (Engineer + Super Admin) */}
              <Route
                path="documents/needs-revision"
                element={withSuspense(
                  <RoleRoute roles={ENGINEER_ONLY}>
                    <NeedsRevisionPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="documents/submit"
                element={withSuspense(
                  <RoleRoute roles={ENGINEER_ONLY}>
                    <SubmitDocumentPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="documents/:id/upload-version"
                element={withSuspense(
                  <RoleRoute roles={ENGINEER_ONLY}>
                    <UploadVersionPage />
                  </RoleRoute>
                )}
              />

              {/* Review routes: Consultant + Engineer + Super Admin */}
              <Route
                path="reviews/pending"
                element={withSuspense(
                  <RoleRoute roles={REVIEWER_ROLES}>
                    <PendingReviewsPage />
                  </RoleRoute>
                )}
              />

              {/* Admin routes (Super Admin only — no exceptions) */}
              <Route
                path="admin/users"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <UsersPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="admin/projects"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <ProjectsPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="admin/projects/:projectId/assign"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <ProjectAssignPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="admin/contracts"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <ContractsPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="admin/documents"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <DocumentsListPage />
                  </RoleRoute>
                )}
              />
              {/* Single Lookups page with Tabs (not scattered sidebar items) */}
              <Route
                path="admin/lookups"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <LookupsPage />
                  </RoleRoute>
                )}
              />
              <Route
                path="admin/coding-order"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <CodingOrderSettingsPage />
                  </RoleRoute>
                )}
              />
              {/* Legacy lookup routes → redirect to unified Lookups with tab */}
              <Route
                path="admin/departments"
                element={<Navigate to="/admin/lookups?tab=departments" replace />}
              />
              <Route
                path="admin/contractors"
                element={<Navigate to="/admin/lookups?tab=contractors" replace />}
              />
              <Route
                path="admin/document-types"
                element={<Navigate to="/admin/lookups?tab=document-types" replace />}
              />
              <Route
                path="admin/document-categories"
                element={<Navigate to="/admin/lookups?tab=document-categories" replace />}
              />
              {/* Assignments is no longer a primary sidebar page; redirect to projects */}
              <Route
                path="admin/assignments"
                element={<Navigate to="/admin/projects" replace />}
              />
              <Route
                path="admin/audit-logs"
                element={withSuspense(
                  <RoleRoute roles={SUPER_ADMIN_ONLY}>
                    <AuditLogsPage />
                  </RoleRoute>
                )}
              />

              <Route path="*" element={withSuspense(<NotFoundPage />)} />
            </Route>

            <Route path="*" element={withSuspense(<NotFoundPage />)} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
