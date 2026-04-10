import { useEffect, useState } from 'react'
import { GraphCanvas } from '@components/GraphCanvas'
import { Sidebar } from '@components/Sidebar'
import { Toolbar } from '@components/Toolbar'
import { NodePanel } from '@components/NodePanel'
import { SearchBox } from '@components/SearchBox'
import { WelcomeModal } from '@components/WelcomeModal'
import { useGraphStore } from '@stores/graphStore'
import { useUIStore } from '@stores/uiStore'
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts'
import { storageService } from '@services/storage'
import './styles/App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const { nodes, edges, loadNodes, loadEdges, selectNode } = useGraphStore()
  const { sidebarOpen, rightPanelOpen } = useUIStore()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewNode: () => selectNode('new'),
    onSearch: () => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement
      searchInput?.focus()
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

  // Auto-save effect
  useEffect(() => {
    if (isLoading) return
    
    const interval = setInterval(() => {
      storageService.save({ nodes, edges })
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
      {/* Welcome Modal */}
      <WelcomeModal onClose={() => {}} />

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
