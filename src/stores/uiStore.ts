import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { UIState, AppSettings } from '@mytypes'

// 默认设置
const defaultSettings: AppSettings = {
  ai: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    apiKeys: {} as Record<string, string>,
    temperature: 0.7,
    maxTokens: 2048,
    streamEnabled: true,
    contextWindow: 4000,
  },
  display: {
    theme: 'dark',
    nodeSize: 20,
    edgeWidth: 2,
    labelSize: 12,
    showAnimation: true,
    showGrid: false,
    lodAutoSwitch: true,
  },
  behavior: {
    autoSave: true,
    autoSaveInterval: 30000,
    confirmDelete: true,
    autoSummarize: true,
    summarizeThreshold: 10,
    actionConfirm: true,
    oobeCompleted: false,
  },
  keyboard: {
    newNode: 'ctrl+n',
    newBlock: 'ctrl+shift+n',
    search: 'ctrl+f',
    save: 'ctrl+s',
    delete: 'delete',
    zoomIn: 'ctrl+plus',
    zoomOut: 'ctrl+minus',
    resetView: 'ctrl+0',
    toggleSidebar: 'ctrl+b',
    togglePanel: 'ctrl+p',
  }
}

// UI State 接口扩展
interface UIStateExtended extends UIState {
  // 设置
  settings: AppSettings
  
  // 设置操作
  updateSettings: (settings: Partial<AppSettings>) => void
  updateAISettings: (settings: Partial<AppSettings['ai']>) => void
  updateDisplaySettings: (settings: Partial<AppSettings['display']>) => void
  updateBehaviorSettings: (settings: Partial<AppSettings['behavior']>) => void
  
  // UI 操作
  toggleSidebar: () => void
  toggleRightPanel: () => void
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: UIState['activeTab']) => void
  setViewMode: (mode: UIState['viewMode']) => void
  setSidebarTab: (tab: UIState['sidebarTab']) => void
  toggleDarkMode: () => void
  toggleLabels: () => void
  toggleClusters: () => void
  toggleAnimation: () => void
  toggleLODIndicator: () => void
  toggleStreamAnimations: () => void
  setDarkMode: (enabled: boolean) => void
  getActiveSession: () => null
  
  // OOBE
  showOOBE: boolean
  setShowOOBE: (show: boolean) => void
}

export const useUIStore = create<UIStateExtended>()(
  devtools(
    persist(
      (set) => ({
        // UI 状态
        sidebarOpen: true,
        rightPanelOpen: true,
        searchQuery: '',
        activeTab: 'all',
        darkMode: true,
        showLabels: true,
        showClusters: false,
        animationEnabled: true,
        
        // 新增
        viewMode: 'graph',
        sidebarTab: 'files',
        showLODIndicator: false,
        streamAnimations: true,
        
        // OOBE
        showOOBE: false,
        
        // 设置
        settings: defaultSettings,
        
        // ===== 设置操作 =====
        
        updateSettings: (newSettings) => {
          set((state) => ({
            settings: { ...state.settings, ...newSettings }
          }))
        },
        
        updateAISettings: (aiSettings) => {
          set((state) => ({
            settings: {
              ...state.settings,
              ai: { ...state.settings.ai, ...aiSettings }
            }
          }))
        },
        
        updateDisplaySettings: (displaySettings) => {
          set((state) => ({
            settings: {
              ...state.settings,
              display: { ...state.settings.display, ...displaySettings }
            }
          }))
        },
        
        updateBehaviorSettings: (behaviorSettings) => {
          set((state) => ({
            settings: {
              ...state.settings,
              behavior: { ...state.settings.behavior, ...behaviorSettings }
            }
          }))
        },
        
        // ===== UI 操作 =====
        
        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }))
        },
        
        toggleRightPanel: () => {
          set((state) => ({ rightPanelOpen: !state.rightPanelOpen }))
        },
        
        setSearchQuery: (query) => {
          set({ searchQuery: query })
        },
        
        setActiveTab: (tab) => {
          set({ activeTab: tab })
        },
        
        setViewMode: (mode) => {
          set({ viewMode: mode })
        },
        
        setSidebarTab: (tab) => {
          set({ sidebarTab: tab })
        },
        
        toggleDarkMode: () => {
          set((state) => ({ darkMode: !state.darkMode }))
        },
        
        setDarkMode: (enabled) => {
          set({ darkMode: enabled })
        },
        
        toggleLabels: () => {
          set((state) => ({ showLabels: !state.showLabels }))
        },
        
        toggleClusters: () => {
          set((state) => ({ showClusters: !state.showClusters }))
        },
        
        toggleAnimation: () => {
          set((state) => ({ animationEnabled: !state.animationEnabled }))
        },
        
        toggleLODIndicator: () => {
          set((state) => ({ showLODIndicator: !state.showLODIndicator }))
        },
        
        toggleStreamAnimations: () => {
          set((state) => ({ streamAnimations: !state.streamAnimations }))
        },
        
        getActiveSession: () => null,
        
        setShowOOBE: (show) => set({ showOOBE: show }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          settings: state.settings,
          darkMode: state.darkMode,
          showLabels: state.showLabels,
          showClusters: state.showClusters,
          animationEnabled: state.animationEnabled,
          viewMode: state.viewMode,
          showLODIndicator: state.showLODIndicator,
          streamAnimations: state.streamAnimations,
        })
      }
    ),
    { name: 'ui-store' }
  )
)
