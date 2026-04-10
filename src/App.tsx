import { useEffect, useState } from 'react'
import { GraphCanvas } from '@components/GraphCanvas'
import { Sidebar } from '@components/Sidebar'
import { Toolbar } from '@components/Toolbar'
import { NodePanel } from '@components/NodePanel'
import { SearchBox } from '@components/SearchBox'
import { OOBE } from '@components/OOBE'
import { useGraphStore } from '@stores/graphStore'
import { useUIStore } from '@stores/uiStore'
import { useSessionStore } from '@stores/sessionStore'
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts'
import { storageService } from '@services/storage'
import './styles/App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const { 
    nodes, 
    edges, 
    loadNodes, 
    loadEdges, 
    selectNode,
    selectedNodeId,
    createAIResponseNode,
    createBranchNode,
    deleteNode,
  } = useGraphStore()
  const { sidebarOpen, rightPanelOpen, settings, showOOBE, setShowOOBE } = useUIStore()
  const { getActiveSession } = useSessionStore()
  
  const activeSession = getActiveSession()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewNode: () => selectNode('new'),
    onNewBlock: () => {
      // Create a new block at center
      const { createNode } = useGraphStore.getState()
      createNode({
        type: 'block',
        label: 'New Block',
        content: '',
        position: { x: 0, y: 0 },
      })
    },
    onAskAI: () => {
      if (selectedNodeId) {
        createAIResponseNode({
          parentId: selectedNodeId,
          sessionId: activeSession?.id || '',
          aiConfig: { provider: 'openai', model: 'gpt-4o-mini' },
        })
      }
    },
    onCreateBranch: () => {
      if (selectedNodeId) {
        createBranchNode({
          parentId: selectedNodeId,
          sessionId: activeSession?.id || '',
        })
      }
    },
    onSearch: () => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement
      searchInput?.focus()
    },
    onDelete: () => {
      if (selectedNodeId) {
        deleteNode(selectedNodeId)
      }
    },
    onEscape: () => selectNode(null),
  })

  useEffect(() => {
    // Load initial data
    const init = async () => {
      try {
        await loadNodes()
        await loadEdges()
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [loadNodes, loadEdges])

  // Check if OOBE should be shown on first launch
  useEffect(() => {
    if (!isLoading && !settings.behavior?.oobeCompleted && !showOOBE) {
      const timer = setTimeout(() => {
        setShowOOBE(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, settings.behavior?.oobeCompleted])

  // Auto-save effect
  useEffect(() => {
    if (isLoading) return
    
    const interval = setInterval(() => {
      storageService.saveAll({ nodes, edges })
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(interval)
  }, [nodes, edges, isLoading])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-star"></div>
        <h1>HoloGraph</h1>
        <p>正在初始化知识宇�?..</p>
      </div>
    )
  }

  return (
    <div className="app">
      {/* OOBE Modal */}
      <OOBE 
        isOpen={showOOBE} 
        onClose={() => setShowOOBE(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Toolbar */}
        <header className="toolbar">
          <Toolbar />
        </header>

        {/* Search Box */}
        <div className="search-container">
          <SearchBox />
        </div>

        {/* Graph Canvas */}
        <div className="canvas-container">
          <GraphCanvas />
        </div>
      </main>

      {/* Right Panel */}
      <aside className={`right-panel ${rightPanelOpen ? 'open' : 'closed'}`}>
        <NodePanel />
      </aside>
    </div>
  )
}

export default App
