import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { notificationsApi } from '@/api'
import { useUserStore, useThemeStore, useUIStore, useLanguageStore } from '@/stores'
import { useTranslation } from '@/i18n/useTranslation'
import { authService } from '@/services/authService'
import {
  Bell,
  Sun,
  Moon,
  Search,
  Menu,
  Command,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

export const Topbar: React.FC = () => {
  const { currentUser, setCurrentUser } = useUserStore()
  const { isDark, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { setMobileMenuOpen, setNotificationsOpen, setCommandPaletteOpen } = useUIStore()
  const { language, setLanguage } = useLanguageStore()
  const { t, isRtl } = useTranslation()

  const handleLogout = () => {
    authService.logout()
    navigate('/login', { replace: true })
  }

  // استعادة جلسة المستخدم
  React.useEffect(() => {
    if (!currentUser) {
      const stored = authService.getCurrentUser()
      if (stored) {
        setCurrentUser({
          userId: stored.userId,
          username: stored.username,
          email: stored.email,
          fullName: stored.fullName,
          role: stored.role as any,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }, [currentUser, setCurrentUser])

  // جلب الإشعارات
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'my'],
    queryFn: () => notificationsApi.getMy(),
    enabled: !!currentUser,
    refetchInterval: 20000,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // معرفة اسم الصفحة الحالية لعرض مسار هندسي عصري
  const getPageTitle = () => {
    const p = location.pathname
    if (p === '/dashboard') return { title: 'Dashboard', scope: 'Executive Overview' }
    if (p.includes('/documents')) return { title: 'Document Submittals', scope: 'ISO 19650 Registry' }
    if (p.includes('/contracts')) return { title: 'Contract Packages', scope: 'Procurement & Scope' }
    if (p.includes('/projects')) return { title: 'Master Projects', scope: 'Portfolio' }
    if (p.includes('/users')) return { title: 'User Directory', scope: 'RBAC Security Matrix' }
    if (p.includes('/lookups')) return { title: 'Taxonomies', scope: 'System Standards' }
    if (p.includes('/coding-order')) return { title: 'Coding Order', scope: 'Syntax Configuration' }
    if (p.includes('/audit-logs')) return { title: 'Audit Trail', scope: 'System Governance' }
    return { title: 'Workspace', scope: 'DC SYSTEM' }
  }

  const page = getPageTitle()
  const BreadcrumbArrow = isRtl ? ChevronLeft : ChevronRight

  return (
    <header className="w-full transition-all duration-300 md:pe-3 md:pt-3">
      {/* الكبسولة العائمة المطابقة للسايد بار */}
      <div className="flex h-20 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 shadow-xl shadow-slate-200/40 backdrop-blur-2xl transition-colors dark:border-slate-800/80 dark:bg-[#111622]/95 dark:shadow-black/50 md:rounded-[2rem] md:border md:px-6">
        {/* =========================================================
            الجانب الأيسر: زر الموبايل + مؤشر المسار الهندسي + البحث
        ========================================================= */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* زر فتح السايد بار للهواتف */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 md:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* مؤشر الصفحة والمسار الهندسي (Module Breadcrumb Indicator) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {page.scope}
            </span>
            <BreadcrumbArrow className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700" />
            <h1 className="text-sm font-black text-slate-900 dark:text-white">
              {page.title}
            </h1>
          </div>

          {/* شريط البحث السريع المتناسق */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-2 text-xs font-semibold text-slate-400 shadow-2xs transition-all hover:border-blue-500/40 hover:bg-white hover:text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-slate-900 dark:hover:text-slate-200 cursor-pointer"
          >
            <Search className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span className="hidden sm:inline font-sans">{t('quickSearch')}</span>
            <kbd className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <Command className="h-3 w-3" />
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* =========================================================
            الجانب الأيمن: أدوات التحكم المتناسقة
        ========================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* مبدل اللغة (Segmented Pill) */}
          <div className="flex items-center rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 text-xs font-black dark:border-slate-800 dark:bg-slate-900/80">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-xl px-2.5 py-1 transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`rounded-xl px-2.5 py-1 transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              عربي
            </button>
          </div>

          {/* زر تبديل الوضع الليلي (Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/70 text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            title={isDark ? t('switchToLight') : t('switchToDark')}
          >
            {isDark ? (
              <Sun className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-600" />
            )}
          </button>

          {/* زر الإشعارات الذكي (Notifications) */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/70 text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            title={t('notifications')}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-xs ring-2 ring-white dark:ring-[#111622] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* زر تسجيل الخروج الفوري الأنيق */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/70 text-slate-400 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
            title="Sign out / تسجيل الخروج"
            aria-label="Sign out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Topbar