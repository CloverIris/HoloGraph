import { useState } from 'react'
import { 
  Network, 
  FileText, 
  Code, 
  Lightbulb, 
  MessageSquare, 
  Layers,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Command
} from 'lucide-react'
import { useUIStore, TabType } from '@stores/uiStore'
import { useGraphStore } from '@stores/graphStore'
import type { NodeType } from '@mytypes'
import './Sidebar.css'

const nodeTypeIcons: Record<NodeType, React.ReactNode> = {
  concept: <Network size={16} />,
  note: <FileText size={16} />,
  code: <Code size={16} />,
  idea: <Lightbulb size={16} />,
  tweet: <MessageSquare size={16} />,
  reference: <Layers size={16} />,
}

const nodeTypeLabels: Record<NodeType, string> = {
  concept: 'Concept',
  note: 'Note',
  code: 'Code',
  idea: 'Idea',
  tweet: 'Tweet',
  reference: 'Reference',
}

export function Sidebar() {
  const { toggleSidebar, activeTab, setActiveTab, sidebarOpen } = useUIStore()
  const { nodes, selectNode } = useGraphStore()
  const [filter, setFilter] = useState<NodeType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNodes = nodes.filter((n) => {
    const matchesType = filter === 'all' || n.type === filter
    const matchesSearch = !searchQuery || 
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const tabs = [
    { id: 'all' as TabType, label: 'All', icon: <Network size={18} /> },
    { id: 'concepts' as TabType, label: 'Concepts', icon: <Lightbulb size={18} /> },
    { id: 'code' as TabType, label: 'Code', icon: <Code size={18} /> },
    { id: 'notes' as TabType, label: 'Notes', icon: <FileText size={18} /> },
  ]

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Network size={20} />
          </div>
          <h1>HoloGraph</h1>
        </div>
        <button className="btn-icon toggle-btn" onClick={toggleSidebar} title={sidebarOpen ? 'Collapse' : 'Expand'}>
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div className="sidebar-content">
        {/* Create Button */}
        <div className="sidebar-actions">
          <button 
            className="btn btn-primary create-btn"
            onClick={() => selectNode('new')}
          >
            <Plus size={18} />
            <span>New Node</span>
            <kbd className="shortcut">Ctrl+N</kbd>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && <div className="active-indicator" />}
            </button>
          ))}
        </nav>

        {/* Search in Sidebar */}
        <div className="sidebar-search">
          <div className="search-input-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="filter-section">
          <label>Filter by type</label>
          <select 
            className="select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as NodeType | 'all')}
          >
            <option value="all">All Types</option>
            {(Object.keys(nodeTypeLabels) as NodeType[]).map((type) => (
              <option key={type} value={type}>
                {nodeTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Node List */}
        <div className="node-list">
          <div className="node-list-header">
            <label>Nodes</label>
            <span className="count">{filteredNodes.length}</span>
          </div>
          <div className="node-list-content">
            {filteredNodes.length === 0 ? (
              <div className="empty-state-small">
                <p>No nodes found</p>
              </div>
            ) : (
              filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="node-item"
                  onClick={() => selectNode(node.id)}
                >
                  <div className={`node-icon type-${node.type}`}>
                    {nodeTypeIcons[node.type]}
                  </div>
                  <div className="node-info">
                    <span className="node-label">{node.label}</span>
                    <span className="node-meta">
                      {new Date(node.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="footer-btn">
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <div className="keyboard-hint">
          <Command size={12} />
          <span>K</span>
        </div>
      </div>
    </div>
  )
}
