import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// UI State Types
export type TabType = 'all' | 'concepts' | 'code' | 'notes' | 'clusters'

export interface UIState {
  sidebarOpen: boolean
  rightPanelOpen: boolean
  searchQuery: string
  activeTab: TabType
  darkMode: boolean
  showLabels: boolean
  showClusters: boolean
  animationEnabled: boolean
  settings: {
    ai: {
      enabled: boolean
      provider: 'openai' | 'claude' | 'local'
      apiKey?: string
      model?: string
    }
    display: {
      nodeSize: number
      edgeWidth: number
      labelSize: number
      showAnimation: boolean
      theme: 'dark' | 'light' | 'system'
    }
    behavior: {
      autoSave: boolean
      autoSaveInterval: number
      confirmDelete: boolean
    }
  }
}

interface UIStoreState extends UIState {
  // Actions
  toggleSidebar: () => void
  toggleRightPanel: () => void
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: TabType) => void
  toggleDarkMode: () => void
  toggleShowLabels: () => void
  toggleShowClusters: () => void
  toggleAnimation: () => void
  updateSettings: (settings: Partial<UIState['settings']>) => void
}

const defaultSettings: UIState['settings'] = {
  ai: {
    enabled: false,
    provider: 'openai',
  },
  display: {
    nodeSize: 20,
    edgeWidth: 2,
    labelSize: 12,
    showAnimation: true,
    theme: 'dark',
  },
  behavior: {
    autoSave: true,
    autoSaveInterval: 30000,
    confirmDelete: true,
  },
}

export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      (set) => ({
        // UI State
        sidebarOpen: true,
        rightPanelOpen: false,
        searchQuery: '',
        activeTab: 'all',
        darkMode: true,
        showLabels: true,
        showClusters: true,
        animationEnabled: true,
        settings: defaultSettings,

        // Actions
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        toggleRightPanel: () =>
          set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

        setSearchQuery: (query) => set({ searchQuery: query }),

        setActiveTab: (tab) => set({ activeTab: tab }),

        toggleDarkMode: () =>
          set((state) => ({ darkMode: !state.darkMode })),

        toggleShowLabels: () =>
          set((state) => ({ showLabels: !state.showLabels })),

        toggleShowClusters: () =>
          set((state) => ({ showClusters: !state.showClusters })),

        toggleAnimation: () =>
          set((state) => ({ animationEnabled: !state.animationEnabled })),

        updateSettings: (newSettings) =>
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          })),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          darkMode: state.darkMode,
          showLabels: state.showLabels,
          showClusters: state.showClusters,
          animationEnabled: state.animationEnabled,
          settings: state.settings,
        }),
      }
    ),
    { name: 'ui-store' }
  )
)
