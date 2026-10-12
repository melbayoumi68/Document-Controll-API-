import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void

  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void

  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void

  reviewModal: {
    open: boolean
    versionId: number | null
    documentNumber?: string
    versionNumber?: string
  }
  openReview: (versionId: number, documentNumber: string, versionNumber: string) => void
  closeReview: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  reviewModal: { open: false, versionId: null },
  openReview: (versionId, documentNumber, versionNumber) =>
    set({
      reviewModal: {
        open: true,
        versionId,
        documentNumber,
        versionNumber,
      },
    }),
  closeReview: () => set({ reviewModal: { open: false, versionId: null } }),
}))
