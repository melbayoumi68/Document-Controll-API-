import React from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useUserStore, useUIStore } from '@/stores'
import { useTranslation } from '@/i18n/useTranslation'
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Briefcase,
  Layers,
  Users,
  Bell,
  Activity,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  FileEdit,
  UserCircle,
  Database,
  Hash,
  FileCheck2,
  ShieldCheck,
  HardHat,
  Compass,
  Sparkles,
  Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/i18n/translations'

interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  category: 'core' | 'admin' | 'account'
}

/**
 * بنية الملاحة الهندسية الذكية
 */
const adminNavItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, category: 'core' },
  { to: '/admin/documents', labelKey: 'documents', icon: FileText, category: 'core' },
  { to: '/reviews/pending', labelKey: 'pendingReviews', icon: CheckSquare, category: 'core' },
  { to: '/admin/contracts', labelKey: 'contracts', icon: Briefcase, category: 'admin' },
  { to: '/admin/projects', labelKey: 'projects', icon: Layers, category: 'admin' },
  { to: '/admin/users', labelKey: 'userAccounts', icon: Users, category: 'admin' },
  { to: '/admin/lookups', labelKey: 'systemLookups', icon: Database, category: 'admin' },
  { to: '/admin/coding-order', labelKey: 'codingOrder', icon: Hash, category: 'admin' },
  { to: '/admin/audit-logs', labelKey: 'auditLogs', icon: Activity, category: 'admin' },
  { to: '/notifications', labelKey: 'notifications', icon: Bell, category: 'account' },
]

const engineerNavItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, category: 'core' },
  { to: '/documents', labelKey: 'myDocuments', icon: FileText, category: 'core' },
  { to: '/contracts', labelKey: 'myContracts', icon: Briefcase, category: 'core' },
  { to: '/reviews/pending', labelKey: 'pendingReviews', icon: CheckSquare, category: 'core' },
  { to: '/documents/needs-revision', labelKey: 'needsRevision', icon: FileEdit, category: 'core', badge: 'Action' },
  { to: '/notifications', labelKey: 'notifications', icon: Bell, category: 'account' },
  { to: '/profile', labelKey: 'profile', icon: UserCircle, category: 'account' },
]

const consultantNavItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, category: 'core' },
  { to: '/reviews/pending', labelKey: 'pendingReviews', icon: CheckSquare, category: 'core', badge: 'Review' },
  { to: '/documents', labelKey: 'myDocuments', icon: FileText, category: 'core' },
  { to: '/contracts', labelKey: 'myContracts', icon: Briefcase, category: 'core' },
  { to: '/notifications', labelKey: 'notifications', icon: Bell, category: 'account' },
  { to: '/profile', labelKey: 'profile', icon: UserCircle, category: 'account' },
]

export const Sidebar: React.FC = () => {
  const { currentUser, isSuperAdmin, isEngineer, isConsultant } = useUserStore()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, isRtl } = useTranslation()

  const navItems = isSuperAdmin()
    ? adminNavItems
    : isEngineer()
    ? engineerNavItems
    : isConsultant()
    ? consultantNavItems
    : []

  const isItemActive = (to: string) => {
    const { pathname } = location
    if (to === '/documents' || to === '/admin/documents') {
      return (
        pathname === to ||
        (to === '/documents' && /^\/documents\/\d+/.test(pathname)) ||
        (to === '/admin/documents' && /^\/admin\/documents\/\d+/.test(pathname))
      )
    }
    if (to === '/admin/lookups') {
      return (
        pathname === '/admin/lookups' ||
        pathname.startsWith('/admin/lookups/') ||
        pathname === '/admin/departments' ||
        pathname === '/admin/contractors' ||
        pathname === '/admin/document-types' ||
        pathname === '/admin/document-categories'
      )
    }
    if (to === '/admin/projects') {
      return pathname === '/admin/projects' || pathname.startsWith('/admin/projects/')
    }
    return pathname === to || pathname.startsWith(`${to}/`)
  }

  // تجميع الروابط في أقسام بصرية
  const coreItems = navItems.filter((i) => i.category === 'core')
  const adminItems = navItems.filter((i) => i.category === 'admin')
  const accountItems = navItems.filter((i) => i.category === 'account')

  const getRoleTheme = () => {
    if (isSuperAdmin()) {
      return {
        label: 'Super Admin',
        color: 'text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-300',
        dot: 'bg-purple-500',
        icon: ShieldCheck,
      }
    }
    if (isConsultant()) {
      return {
        label: 'Consultant',
        color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        icon: Compass,
      }
    }
    return {
      label: 'Engineer',
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-300',
      dot: 'bg-blue-500',
      icon: HardHat,
    }
  }

  const roleInfo = getRoleTheme()
  const RoleIcon = roleInfo.icon

  const ExpandIcon = isRtl ? ChevronLeft : ChevronRight
  const CollapseIcon = isRtl ? ChevronRight : ChevronLeft

  const renderSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null

    return (
      <div className="space-y-1">
        {!sidebarCollapsed && (
          <div className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-widest text-slate-400/90 dark:text-slate-500">
            {title}
          </div>
        )}

        {items.map((item) => {
          const isActive = isItemActive(item.to)
          const label = t(item.labelKey)
          const Icon = item.icon

          return (
            <button
              key={item.to}
              onClick={() => {
                navigate(item.to)
                setMobileMenuOpen(false)
              }}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
                sidebarCollapsed && 'justify-center px-0'
              )}
            >
              {/* أيقونة العنصر مع حركة ناعمة */}
              <div
                className={cn(
                  'flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400'
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
              </div>

              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 truncate text-start tracking-tight">{label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide uppercase',
                        isActive
                          ? 'bg-white/20 text-white backdrop-blur-xs'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {/* نقطة مضيئة عند تفعيل العنصر في وضع الطي */}
              {sidebarCollapsed && isActive && (
                <span className="absolute end-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-xs" />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* خلفية التعتيم للهاتف */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md transition-opacity md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* الشريط الجانبي العائم (Floating Modern Dock) */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col transition-all duration-300 ease-in-out md:static md:p-3',
          isRtl ? 'right-0' : 'left-0',
          sidebarCollapsed ? 'w-[84px] md:w-[96px]' : 'w-72 md:w-72',
          mobileMenuOpen
            ? 'translate-x-0'
            : isRtl
            ? 'translate-x-full md:translate-x-0'
            : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-none border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-[#111622]/95 dark:shadow-black/60 md:rounded-[2rem]">
          {/* =========================================================
              1. رأس الهوية الفاخر (Executive Brand Box)
          ========================================================= */}
          <div className="flex h-20 items-center justify-between border-b border-slate-100/90 px-4 dark:border-slate-800/80">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 overflow-hidden group"
            >
              {/* الأيقونة المركزية مع تأثير التوهج */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:scale-105">
                <FileCheck2 className="h-6 w-6" />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#111622]" />
              </div>

              {!sidebarCollapsed && (
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-black tracking-tight text-slate-900 dark:text-white">
                      DC SYSTEM
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      ISO 19650
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">V2.4</span>
                  </div>
                </div>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* =========================================================
              2. زر الإجراء السريع (Floating Action Pill)
          ========================================================= */}
          {(isEngineer() || isSuperAdmin()) && (
            <div className="px-3 pt-3">
              <button
                onClick={() => {
                  navigate('/documents/submit')
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  'group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 p-2.5 text-xs font-black text-white shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40 active:scale-[0.98]',
                  sidebarCollapsed ? 'px-0' : 'px-4'
                )}
                title={sidebarCollapsed ? 'Submit New Submittal' : undefined}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/20 text-white">
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                </div>
                {!sidebarCollapsed && <span>New Submittal</span>}
              </button>
            </div>
          )}

          {/* =========================================================
              3. أقسام الروابط المنسقة (Categorized Navigation)
          ========================================================= */}
          <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3 scrollbar-none">
            {renderSection('Workspace', coreItems)}
            {renderSection('Governance & System', adminItems)}
            {renderSection('Personal & Account', accountItems)}
          </div>

          {/* =========================================================
              4. بطاقة المستخدم الجزيرية وزر الطي (Floating Bottom Island)
          ========================================================= */}
          <div className="border-t border-slate-100/90 p-3 dark:border-slate-800/80">
            {!sidebarCollapsed && currentUser ? (
              <div className="group mb-2.5 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 transition-all hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-900/40">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                    {currentUser?.fullName?.charAt(0) || 'U'}
                    <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900', roleInfo.dot)} />
                  </div>

                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                      {currentUser?.fullName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9px] font-black', roleInfo.color)}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        <span>{roleInfo.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* زر طي السايد بار الحديث */}
            <button
              onClick={toggleSidebar}
              className="hidden w-full items-center justify-center gap-2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 md:flex cursor-pointer"
              title={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            >
              {sidebarCollapsed ? (
                <ExpandIcon className="h-4 w-4" />
              ) : (
                <>
                  <CollapseIcon className="h-4 w-4" />
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    Collapse Sidebar
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar