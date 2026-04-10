import { useState, useRef, useEffect } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Share2, 
  Download, 
  Upload,
  Wand2,
  GitBranch,
  Target,
  HelpCircle,
  Plus,
  Sparkles,
  Layout,
  Settings,
  FileText,
  FolderOpen,
  Save,
  ChevronDown,
  PanelLeft,
  PanelRight,
  Grid3x3,
  Type,
  Bot
} from 'lucide-react'
import { useUIStore } from '@stores/uiStore'
import { useGraphStore } from '@stores/graphStore'
import { useSessionStore } from '@stores/sessionStore'
import './Toolbar.css'

export function Toolbar() {
  const { viewBox, setViewBox, resetView } = useGraphStore()
  const { 
    sidebarOpen,
    rightPanelOpen,
    toggleSidebar, 
    toggleRightPanel, 
    showLabels, 
    toggleLabels, 
    showClusters, 
    toggleClusters,
    animationEnabled,
    toggleAnimation,
    setShowOOBE,
  } = useUIStore()
  const { getActiveSession } = useSessionStore()
  
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)
  const helpMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false)
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false)
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setShowHelpMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleZoomIn = () => {
    setViewBox({ zoom: Math.min(viewBox.zoom * 1.2, 5) })
  }

  const handleZoomOut = () => {
    setViewBox({ zoom: Math.max(viewBox.zoom / 1.2, 0.1) })
  }

  const handleResetView = () => {
    resetView()
  }

  const handleNewNode = () => {
    const { createNode } = useGraphStore.getState()
    const activeSession = getActiveSession()
    createNode({
      type: 'block',
      label: 'New Block',
      content: '',
      position: { x: 0, y: 0 },
      sessionId: activeSession?.id,
    })
  }

  const handleAskAI = () => {
    const { createAIResponseNode, selectedNodeId } = useGraphStore.getState()
    const activeSession = getActiveSession()
    if (selectedNodeId) {
      createAIResponseNode({
        parentId: selectedNodeId,
        sessionId: activeSession?.id || '',
        aiConfig: { provider: 'openai', model: 'gpt-4o-mini' },
      })
    }
  }

  return (
    <div className="toolbar-content">
      {/* Left Section - Brand & File Menu */}
      <div className="toolbar-section">
        {/* Brand */}
        <div className="toolbar-brand">
          <div className="brand-logo">
            <Sparkles size={18} />
          </div>
          <div className="brand-text">
            <span className="brand-name">HoloGraph</span>
            <span className="brand-tagline">Knowledge Graph</span>
          </div>
        </div>

        {/* File Menu */}
        <div className="toolbar-dropdown" ref={fileMenuRef}>
          <button 
            className="toolbar-btn"
            onClick={() => setShowFileMenu(!showFileMenu)}
          >
            <span className="btn-label">文件</span>
            <ChevronDown size={14} />
          </button>
          
          {showFileMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleNewNode}>
                <Plus size={16} />
                <span>新建节点</span>
                <span className="dropdown-shortcut">Ctrl+N</span>
              </div>
              <div className="dropdown-item">
                <FolderOpen size={16} />
                <span>打开项目</span>
                <span className="dropdown-shortcut">Ctrl+O</span>
              </div>
              <div className="dropdown-item">
                <Save size={16} />
                <span>保存</span>
                <span className="dropdown-shortcut">Ctrl+S</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item">
                <Upload size={16} />
                <span>导入数据</span>
              </div>
              <div className="dropdown-item">
                <Download size={16} />
                <span>导出数据</span>
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* Quick Actions */}
        <div className="tool-group">
          <button 
            className="toolbar-btn primary" 
            onClick={handleNewNode}
            data-tooltip="新建节点 (Ctrl+N)"
          >
            <Plus size={18} />
            <span className="btn-label">新建</span>
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={handleAskAI}
            data-tooltip="AI 生成"
          >
            <Bot size={18} />
            <span className="btn-label">AI</span>
          </button>
        </div>
      </div>

      {/* Center Section - View Controls */}
      <div className="toolbar-section center">
        {/* Zoom Controls */}
        <div className="tool-group">
          <span className="tool-group-label">缩放</span>
          <div className="zoom-control">
            <button className="zoom-btn" onClick={handleZoomOut} title="缩小">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-level">{Math.round(viewBox.zoom * 100)}%</span>
            <button className="zoom-btn" onClick={handleZoomIn} title="放大">
              <ZoomIn size={16} />
            </button>
          </div>
          <button 
            className="toolbar-btn icon-only" 
            onClick={handleResetView}
            data-tooltip="重置视图"
          >
            <Maximize size={18} />
          </button>
        </div>

        {/* View Options */}
        <div className="toolbar-dropdown" ref={viewMenuRef}>
          <button 
            className="toolbar-btn"
            onClick={() => setShowViewMenu(!showViewMenu)}
          >
            <Layout size={18} />
            <span className="btn-label">视图</span>
            <ChevronDown size={14} />
          </button>
          
          {showViewMenu && (
            <div className="dropdown-menu">
              <div 
                className={`dropdown-item ${showLabels ? 'active' : ''}`}
                onClick={toggleLabels}
              >
                <Type size={16} />
                <span>显示标签</span>
              </div>
              <div 
                className={`dropdown-item ${showClusters ? 'active' : ''}`}
                onClick={toggleClusters}
              >
                <GitBranch size={16} />
                <span>显示聚类</span>
              </div>
              <div 
                className={`dropdown-item ${animationEnabled ? 'active' : ''}`}
                onClick={toggleAnimation}
              >
                <Sparkles size={16} />
                <span>动画效果</span>
              </div>
              <div className="dropdown-divider" />
              <div 
                className={`dropdown-item ${sidebarOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
              >
                <PanelLeft size={16} />
                <span>侧边栏</span>
                <span className="dropdown-shortcut">Ctrl+B</span>
              </div>
              <div 
                className={`dropdown-item ${rightPanelOpen ? 'active' : ''}`}
                onClick={toggleRightPanel}
              >
                <PanelRight size={16} />
                <span>详情面板</span>
                <span className="dropdown-shortcut">Ctrl+P</span>
              </div>
            </div>
          )}
        </div>

        {/* Layout */}
        <div className="tool-group">
          <span className="tool-group-label">布局</span>
          <button className="toolbar-btn icon-only" data-tooltip="自动布局">
            <Grid3x3 size={18} />
          </button>
          <button className="toolbar-btn icon-only" data-tooltip="网格对齐">
            <Target size={18} />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="toolbar-section right">
        {/* Status */}
        <div className="status-indicator">
          <span className="status-dot" />
          <span>就绪</span>
        </div>

        <div className="toolbar-divider" />

        {/* Tools */}
        <div className="tool-group">
          <button className="toolbar-btn icon-only" data-tooltip="AI 分析">
            <Wand2 size={18} />
          </button>
          <button className="toolbar-btn icon-only" data-tooltip="分享">
            <Share2 size={18} />
          </button>
        </div>

        {/* Help Menu */}
        <div className="toolbar-dropdown" ref={helpMenuRef}>
          <button 
            className="toolbar-btn icon-only"
            onClick={() => setShowHelpMenu(!showHelpMenu)}
            data-tooltip="帮助"
          >
            <HelpCircle size={18} />
          </button>
          
          {showHelpMenu && (
            <div className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
              <div className="dropdown-item" onClick={() => {
                setShowOOBE(true)
                setShowHelpMenu(false)
              }}>
                <Sparkles size={16} />
                <span>重新打开引导</span>
              </div>
              <div className="dropdown-item">
                <FileText size={16} />
                <span>快捷键参考</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item">
                <Settings size={16} />
                <span>设置</span>
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* Panel Toggles */}
        <button 
          className={`toolbar-btn icon-only ${sidebarOpen ? 'active' : ''}`}
          onClick={toggleSidebar}
          data-tooltip="侧边栏"
        >
          <PanelLeft size={18} />
        </button>
        <button 
          className={`toolbar-btn icon-only ${rightPanelOpen ? 'active' : ''}`}
          onClick={toggleRightPanel}
          data-tooltip="详情面板"
        >
          <PanelRight size={18} />
        </button>
      </div>
    </div>
  )
}
