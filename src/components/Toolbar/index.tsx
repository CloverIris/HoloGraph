import { 
  Menu, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Share2, 
  Download, 
  Upload,
  Wand2,
  GitBranch,
  Target,
  HelpCircle
} from 'lucide-react'
import { useUIStore } from '@stores/uiStore'
import { useGraphStore } from '@stores/graphStore'
import './Toolbar.css'

export function Toolbar() {
  const { viewBox, setViewBox } = useGraphStore()
  const { 
    toggleSidebar, 
    toggleRightPanel, 
    showLabels, 
    toggleLabels, 
    showClusters, 
    toggleClusters 
  } = useUIStore()

  const handleZoomIn = () => {
    setViewBox({ zoom: Math.min(viewBox.zoom * 1.2, 5) })
  }

  const handleZoomOut = () => {
    setViewBox({ zoom: Math.max(viewBox.zoom / 1.2, 0.1) })
  }

  const handleResetView = () => {
    setViewBox({ x: 0, y: 0, zoom: 1 })
  }

  return (
    <div className="toolbar-content">
      {/* Left Section */}
      <div className="toolbar-section">
        <button className="btn-icon" onClick={toggleSidebar} title="切换侧边栏">
          <Menu size={20} />
        </button>
        <div className="toolbar-divider" />
        <span className="toolbar-title">全像星图</span>
      </div>

      {/* Center Section - View Controls */}
      <div className="toolbar-section center">
        <div className="view-controls">
          <button className="btn-icon" onClick={handleZoomOut} title="缩小">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-level">{Math.round(viewBox.zoom * 100)}%</span>
          <button className="btn-icon" onClick={handleZoomIn} title="放大">
            <ZoomIn size={18} />
          </button>
          <button className="btn-icon" onClick={handleResetView} title="重置视图">
            <Maximize size={18} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="view-toggles">
          <button 
            className={`btn-icon ${showLabels ? 'active' : ''}`}
            onClick={toggleLabels}
            title="显示标签"
          >
            <Target size={18} />
          </button>
          <button 
            className={`btn-icon ${showClusters ? 'active' : ''}`}
            onClick={toggleClusters}
            title="显示聚类"
          >
            <GitBranch size={18} />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="toolbar-section right">
        <button className="btn-icon" title="AI 分析">
          <Wand2 size={18} />
        </button>
        <button className="btn-icon" title="导入">
          <Upload size={18} />
        </button>
        <button className="btn-icon" title="导出">
          <Download size={18} />
        </button>
        <button className="btn-icon" title="分享">
          <Share2 size={18} />
        </button>
        <div className="toolbar-divider" />
        <button className="btn-icon" title="帮助">
          <HelpCircle size={18} />
        </button>
        <button className="btn-icon" onClick={toggleRightPanel} title="切换详情面板">
          <Menu size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  )
}
