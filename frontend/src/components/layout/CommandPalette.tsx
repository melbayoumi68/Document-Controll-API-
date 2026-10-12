import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore, useUserStore, useThemeStore } from '@/stores'
import {
  Search,
  FileText,
  Briefcase,
  LayoutDashboard,
  CheckSquare,
  Users,
  UserCheck,
  Moon,
  Sun,
  PlusCircle,
  X,
  Bell,
  UserCircle,
  Layers,
  Building2,
  HardHat,
  FileType2,
  FolderTree,
  FileEdit,
  Activity,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  action: () => void
}

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { isDark, toggleTheme } = useThemeStore()
  const { isSuperAdmin, isEngineer, isConsultant } = useUserStore()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  if (!commandPaletteOpen) return null

  const go = (path: string) => {
    navigate(path)
    setCommandPaletteOpen(false)
  }

  // Shared items — scoped routes only, visible to every authenticated role
  const items: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-blue-500" />,
      action: () => go('/dashboard'),
    },
    {
      id: 'documents',
      label: 'My Documents',
      category: 'Navigation',
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      action: () => go('/documents'),
    },
    {
      id: 'contracts',
      label: 'My Contracts',
      category: 'Navigation',
      icon: <Briefcase className="w-4 h-4 text-emerald-500" />,
      action: () => go('/contracts'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      category: 'Navigation',
      icon: <Bell className="w-4 h-4 text-amber-500" />,
      action: () => go('/notifications'),
    },
    {
      id: 'profile',
      label: 'Profile',
      category: 'Navigation',
      icon: <UserCircle className="w-4 h-4 text-slate-500" />,
      action: () => go('/profile'),
    },
    {
      id: 'theme',
      label: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      category: 'Preferences',
      icon: isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-400" />
      ),
      action: () => {
        toggleTheme()
        setCommandPaletteOpen(false)
      },
    },
  ]

  // Role-scoped items — engineers and consultants never see admin commands
  if (isEngineer()) {
    items.unshift(
      {
        id: 'submit-doc',
        label: 'Submit New Document',
        category: 'Actions',
        icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
        action: () => go('/documents/submit'),
      },
      {
        id: 'needs-revision',
        label: 'Needs Revision',
        category: 'Navigation',
        icon: <FileEdit className="w-4 h-4 text-orange-500" />,
        action: () => go('/documents/needs-revision'),
      }
    )
  }

  if (isConsultant()) {
    items.unshift({
      id: 'pending-reviews',
      label: 'Pending Reviews',
      category: 'Actions',
      icon: <CheckSquare className="w-4 h-4 text-purple-500" />,
      action: () => go('/reviews/pending'),
    })
  }

  if (isSuperAdmin()) {
    items.unshift(
      {
        id: 'admin-projects',
        label: 'Projects',
        category: 'Admin',
        icon: <Layers className="w-4 h-4 text-amber-500" />,
        action: () => go('/admin/projects'),
      },
      {
        id: 'admin-assignments',
        label: 'Assignments',
        category: 'Admin',
        icon: <UserCheck className="w-4 h-4 text-blue-500" />,
        action: () => go('/admin/assignments'),
      },
      {
        id: 'admin-users',
        label: 'User Management',
        category: 'Admin',
        icon: <Users className="w-4 h-4 text-pink-500" />,
        action: () => go('/admin/users'),
      },
      {
        id: 'admin-departments',
        label: 'Departments',
        category: 'Admin',
        icon: <Building2 className="w-4 h-4 text-indigo-500" />,
        action: () => go('/admin/departments'),
      },
      {
        id: 'admin-contractors',
        label: 'Contractors',
        category: 'Admin',
        icon: <HardHat className="w-4 h-4 text-orange-500" />,
        action: () => go('/admin/contractors'),
      },
      {
        id: 'admin-doc-types',
        label: 'Document Types',
        category: 'Admin',
        icon: <FileType2 className="w-4 h-4 text-cyan-500" />,
        action: () => go('/admin/document-types'),
      },
      {
        id: 'admin-doc-categories',
        label: 'Document Categories',
        category: 'Admin',
        icon: <FolderTree className="w-4 h-4 text-emerald-500" />,
        action: () => go('/admin/document-categories'),
      },
      {
        id: 'admin-documents',
        label: 'All Documents',
        category: 'Admin',
        icon: <FileText className="w-4 h-4 text-blue-500" />,
        action: () => go('/admin/documents'),
      },
      {
        id: 'admin-audit-logs',
        label: 'Audit Logs',
        category: 'Admin',
        icon: <Activity className="w-4 h-4 text-rose-500" />,
        action: () => go('/admin/audit-logs'),
      }
    )
  }

  const filtered = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.category}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-blue-500 font-mono">
                  Jump →
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigation Quick Menu</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  )
}
