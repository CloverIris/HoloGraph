import { useRef, useState, useCallback } from 'react'
import { useGraphStore } from '@stores/graphStore'
import { useUIStore } from '@stores/uiStore'
import { ContextMenu } from '@components/ContextMenu'
import { InlineEditor } from '@components/InlineEditor'
import type { KnowledgeNode, KnowledgeEdge } from '@mytypes'
import './GraphCanvas.css'

// Node type colors - updated for conversation system
const nodeTypeColors: Record<string, { bg: string; border: string; glow: string }> = {
  // New conversation types
  block: { bg: 'rgba(76, 175, 80, 0.2)', border: '#4caf50', glow: 'rgba(76, 175, 80, 0.4)' },
  'ai-response': { bg: 'rgba(33, 150, 243, 0.2)', border: '#2196f3', glow: 'rgba(33, 150, 243, 0.4)' },
  branch: { bg: 'rgba(255, 152, 0, 0.2)', border: '#ff9800', glow: 'rgba(255, 152, 0, 0.4)' },
  summary: { bg: 'rgba(156, 39, 176, 0.2)', border: '#9c27b0', glow: 'rgba(156, 39, 176, 0.4)' },
  todo: { bg: 'rgba(233, 30, 99, 0.2)', border: '#e91e63', glow: 'rgba(233, 30, 99, 0.4)' },
  action: { bg: 'rgba(0, 188, 212, 0.2)', border: '#00bcd4', glow: 'rgba(0, 188, 212, 0.4)' },
  knowledge: { bg: 'rgba(121, 85, 72, 0.2)', border: '#795548', glow: 'rgba(121, 85, 72, 0.4)' },
  session: { bg: 'rgba(96, 125, 139, 0.2)', border: '#607d8b', glow: 'rgba(96, 125, 139, 0.4)' },
  // Legacy types
  concept: { bg: 'rgba(0, 120, 212, 0.2)', border: '#0078d4', glow: 'rgba(0, 120, 212, 0.4)' },
  note: { bg: 'rgba(16, 124, 16, 0.2)', border: '#107c10', glow: 'rgba(16, 124, 16, 0.4)' },
  code: { bg: 'rgba(255, 140, 0, 0.2)', border: '#ff8c00', glow: 'rgba(255, 140, 0, 0.4)' },
  idea: { bg: 'rgba(209, 52, 56, 0.2)', border: '#d13438', glow: 'rgba(209, 52, 56, 0.4)' },
  tweet: { bg: 'rgba(0, 183, 195, 0.2)', border: '#00b7c3', glow: 'rgba(0, 183, 195, 0.4)' },
  reference: { bg: 'rgba(135, 100, 184, 0.2)', border: '#8764b8', glow: 'rgba(135, 100, 184, 0.4)' },
}



// FIXED: Use constant viewBox for simplicity
const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 700

export function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [, setIsDragging] = useState(false)
  const [dragNode, setDragNode] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node: KnowledgeNode | null
  } | null>(null)
  
  // Inline editing state
  const [inlineEditingNodeId, setInlineEditingNodeId] = useState<string | null>(null)

  const { 
    nodes, 
    edges, 
    selectedNodeId, 
    viewBox, 
    setViewBox, 
    selectNode, 
    updateNode,
    getNodeNeighbors,
    resetView,
    createNode,
    createAIResponseNode,
    createBranchNode,
    deleteNode,
  } = useGraphStore()
  const { showLabels } = useUIStore()

  // FIXED: Simplified viewBox handling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(3, viewBox.zoom * scaleFactor))
    setViewBox({ zoom: newZoom })
  }, [viewBox.zoom, setViewBox])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setIsPanning(true)
      setLastMouse({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = (e.clientX - lastMouse.x) / viewBox.zoom
      const dy = (e.clientY - lastMouse.y) / viewBox.zoom
      setViewBox({
        x: viewBox.x - dx,
        y: viewBox.y - dy,
      })
      setLastMouse({ x: e.clientX, y: e.clientY })
    } else if (dragNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / viewBox.zoom + viewBox.x
      const y = (e.clientY - rect.top) / viewBox.zoom + viewBox.y
      updateNode(dragNode, { position: { x, y } })
    }
  }, [isPanning, dragNode, lastMouse, viewBox, setViewBox, updateNode])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDragNode(null)
    setIsDragging(false)
  }, [])

  // Double click to create new block
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only handle if clicking on empty canvas (not on nodes)
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      e.preventDefault()
      
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = (e.clientX - rect.left) / viewBox.zoom + viewBox.x
      const y = (e.clientY - rect.top) / viewBox.zoom + viewBox.y
      
      // Create new block node
      createNode({
        label: 'New Block',
        content: '',
        type: 'block',
        position: { x, y },
      }).then((node) => {
        selectNode(node.id)
        setInlineEditingNodeId(node.id)
      })
    }
  }, [viewBox.zoom, viewBox.x, viewBox.y, createNode, selectNode])

  // Right click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    // Check if clicking on a node
    const target = e.target as Element
    const nodeElement = target.closest('[data-node-id]')
    const nodeId = nodeElement?.getAttribute('data-node-id')
    const node = nodeId ? nodes.find((n) => n.id === nodeId) : null
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node: node || null,
    })
  }, [nodes])

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Context menu actions
  const handleEditNode = useCallback(() => {
    if (contextMenu?.node) {
      setInlineEditingNodeId(contextMenu.node.id)
    } else {
      // Create new node if no node selected
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (contextMenu!.x - rect.left) / viewBox.zoom + viewBox.x
        const y = (contextMenu!.y - rect.top) / viewBox.zoom + viewBox.y
        
        createNode({
          label: 'New Block',
          content: '',
          type: 'block',
          position: { x, y },
        }).then((node) => {
          selectNode(node.id)
          setInlineEditingNodeId(node.id)
        })
      }
    }
  }, [contextMenu, viewBox, createNode, selectNode])

  const handleAskAI = useCallback(() => {
    if (contextMenu?.node) {
      createAIResponseNode({
        parentId: contextMenu.node.id,
        sessionId: contextMenu.node.metadata?.sessionId || '',
        aiConfig: contextMenu.node.metadata?.aiConfig || { provider: 'openai', model: 'gpt-4o-mini' },
      })
    }
  }, [contextMenu, createAIResponseNode])

  const handleCreateBranch = useCallback(() => {
    if (contextMenu?.node) {
      createBranchNode({
        parentId: contextMenu.node.id,
        sessionId: contextMenu.node.metadata?.sessionId || '',
      })
    }
  }, [contextMenu, createBranchNode])

  const handleSummarize = useCallback(() => {
    // TODO: Implement summarize
    console.log('Summarize:', contextMenu?.node?.id)
  }, [contextMenu])

  const handleConnect = useCallback(() => {
    // TODO: Implement connect mode
    console.log('Connect:', contextMenu?.node?.id)
  }, [contextMenu])

  const handleDuplicate = useCallback(() => {
    // TODO: Implement duplicate
    console.log('Duplicate:', contextMenu?.node?.id)
  }, [contextMenu])

  const handleDeleteNode = useCallback(() => {
    if (contextMenu?.node) {
      deleteNode(contextMenu.node.id)
    }
  }, [contextMenu, deleteNode])

  // Inline editor handlers
  const handleSaveInlineEdit = useCallback(() => {
    setInlineEditingNodeId(null)
  }, [])

  const handleCancelInlineEdit = useCallback(() => {
    setInlineEditingNodeId(null)
  }, [])

  // Calculate highlighted nodes
  const highlightedNodes = selectedNodeId && selectedNodeId !== 'new'
    ? getNodeNeighbors(selectedNodeId).nodes.map((n) => n.id)
    : []

  // Calculate viewBox dimensions
  const vbWidth = VIEWBOX_WIDTH / viewBox.zoom
  const vbHeight = VIEWBOX_HEIGHT / viewBox.zoom

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="graph-canvas empty" ref={containerRef}>
        <div className="empty-state">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none"/>
            <circle cx="60" cy="60" r="20" fill="rgba(0,120,212,0.3)"/>
            <circle cx="30" cy="40" r="8" fill="rgba(255,255,255,0.2)"/>
            <circle cx="90" cy="80" r="6" fill="rgba(255,255,255,0.15)"/>
          </svg>
          <h3>No nodes yet</h3>
          <p>Click the + button to create your first knowledge node</p>
          <button className="btn btn-primary" onClick={() => selectNode('new')}>
            Create Node
          </button>
        </div>
      </div>
    )
  }

  // Get inline editing node (used in rendering below via inlineEditingNodeId)

  return (
    <div 
      ref={containerRef}
      className="graph-canvas"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <svg
        ref={svgRef}
        className="graph-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${vbWidth} ${vbHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="0.5" cy="0.5" r="0.8" fill="rgba(255, 255, 255, 0.06)" />
          </pattern>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.3)" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect
          x={viewBox.x - 5000}
          y={viewBox.y - 5000}
          width={10000}
          height={10000}
          fill="url(#grid)"
        />

        {/* Center marker */}
        <circle cx="0" cy="0" r="3" fill="rgba(255,255,255,0.2)" />

        {/* Edges */}
        <g className="edges">
          {edges.map((edge) => {
            const source = nodes.find((n) => n.id === edge.source)
            const target = nodes.find((n) => n.id === edge.target)
            if (!source || !target) return null

            const isHighlighted = selectedNodeId && 
              (edge.source === selectedNodeId || edge.target === selectedNodeId)
            const isDimmed = selectedNodeId && 
              edge.source !== selectedNodeId && 
              edge.target !== selectedNodeId

            return (
              <EdgeLine
                key={edge.id}
                edge={edge}
                source={source}
                target={target}
                isHighlighted={!!isHighlighted}
                isDimmed={!!isDimmed}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId
            const isHighlighted = highlightedNodes.includes(node.id)
            const isHovered = node.id === hoveredNode
            const isDimmed = Boolean(
              selectedNodeId && 
              node.id !== selectedNodeId && 
              !isHighlighted
            )
            const isEditing = node.id === inlineEditingNodeId

            return (
              <g key={node.id} data-node-id={node.id}>
                <NodeCircle
                  node={node}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  showLabel={showLabels}
                  onClick={() => {
                    if (!isEditing) {
                      selectNode(node.id)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    if (!isEditing) {
                      setDragNode(node.id)
                      setIsDragging(true)
                    }
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                
                {/* Inline Editor */}
                {isEditing && (
                  <foreignObject
                    x={node.position.x - 140}
                    y={node.position.y + 30}
                    width={280}
                    height={200}
                  >
                    <InlineEditor
                      nodeId={node.id}
                      initialContent={node.content}
                      onSave={handleSaveInlineEdit}
                      onCancel={handleCancelInlineEdit}
                    />
                  </foreignObject>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Overlay Info */}
      <div className="canvas-overlay">
        <div className="canvas-info">
          <span>Nodes: {nodes.length}</span>
          <span>Edges: {edges.length}</span>
          <span>Zoom: {Math.round(viewBox.zoom * 100)}%</span>
        </div>
        <button className="btn-icon" onClick={resetView} title="Reset View">
          ⟲
        </button>
      </div>

      {/* FAB */}
      <button 
        className="fab"
        onClick={() => selectNode('new')}
        title="Create new node"
      >
        +
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={handleCloseContextMenu}
          onEdit={handleEditNode}
          onAskAI={handleAskAI}
          onCreateBranch={handleCreateBranch}
          onSummarize={handleSummarize}
          onConnect={handleConnect}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  )
}

// Edge Component
interface EdgeLineProps {
  edge: KnowledgeEdge
  source: KnowledgeNode
  target: KnowledgeNode
  isHighlighted: boolean
  isDimmed: boolean
}

function EdgeLine({ edge, source, target, isHighlighted, isDimmed }: EdgeLineProps) {
  const dx = target.position.x - source.position.x
  const dy = target.position.y - source.position.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) return null
  
  const nodeRadius = 22
  const offsetX = (dx / length) * nodeRadius
  const offsetY = (dy / length) * nodeRadius
  
  const x1 = source.position.x + offsetX
  const y1 = source.position.y + offsetY
  const x2 = target.position.x - offsetX
  const y2 = target.position.y - offsetY

  return (
    <g 
      className={`edge ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
      style={{ opacity: isDimmed ? 0.15 : isHighlighted ? 1 : 0.5 }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isHighlighted ? '#0078d4' : 'rgba(255, 255, 255, 0.4)'}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
      />
      {edge.label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          fill={isHighlighted ? '#0091ff' : 'rgba(255, 255, 255, 0.6)'}
          fontSize="11"
          textAnchor="middle"
        >
          {edge.label}
        </text>
      )}
    </g>
  )
}

// Node Component
interface NodeCircleProps {
  node: KnowledgeNode
  isSelected: boolean
  isHighlighted: boolean
  isHovered: boolean
  isDimmed: boolean
  showLabel: boolean
  onClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function NodeCircle({ 
  node, 
  isSelected, 
  isHighlighted, 
  isHovered, 
  isDimmed,
  showLabel,
  onClick, 
  onMouseDown,
  onMouseEnter,
  onMouseLeave
}: NodeCircleProps) {
  const colors = nodeTypeColors[node.type] || nodeTypeColors.block
  const size = isSelected ? 26 : isHighlighted ? 24 : 20
  const glowOpacity = isSelected ? 0.8 : isHovered ? 0.5 : 0.3
  const isStreaming = node.metadata?.status === 'streaming'
  const isBlockNode = node.type === 'block' || node.type === 'concept' || node.type === 'note'
  const isAIResponse = node.type === 'ai-response' || node.type === 'idea'

  // Block-style node (rectangle)
  if (isBlockNode) {
    const width = 140
    const height = 50
    
    return (
      <g 
        className={`node node-block ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      >
        {/* Glow */}
        <rect
          x={node.position.x - width/2 - 10}
          y={node.position.y - height/2 - 10}
          width={width + 20}
          height={height + 20}
          rx={20}
          fill={colors.glow}
          opacity={glowOpacity}
          filter="url(#glow)"
        />
        
        {/* Main rectangle */}
        <rect
          x={node.position.x - width/2}
          y={node.position.y - height/2}
          width={width}
          height={height}
          rx={12}
          fill={colors.bg}
          stroke={isSelected ? colors.border : 'rgba(255,255,255,0.2)'}
          strokeWidth={isSelected ? 3 : 1}
        />
        
        {/* Content preview */}
        {node.content && (
          <foreignObject
            x={node.position.x - width/2 + 8}
            y={node.position.y - height/2 + 8}
            width={width - 16}
            height={height - 16}
          >
            <div className="node-content-preview">
              {node.content.slice(0, 50)}{node.content.length > 50 ? '...' : ''}
            </div>
          </foreignObject>
        )}

        {/* Label */}
        {showLabel && (
          <text
            x={node.position.x}
            y={node.position.y + height/2 + 16}
            fill="white"
            fontSize="11"
            fontWeight={isSelected ? 600 : 400}
            textAnchor="middle"
            style={{ opacity: isDimmed ? 0.3 : 1 }}
          >
            {node.label}
          </text>
        )}
        
        {/* Streaming indicator */}
        {isStreaming && <StreamingIndicator x={node.position.x + width/2 + 10} y={node.position.y} />}
      </g>
    )
  }

  // AI Response node (circle with special styling)
  if (isAIResponse) {
    return (
      <g 
        className={`node node-ai ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      >
        {/* Glow */}
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={size + 12}
          fill={colors.glow}
          opacity={isStreaming ? 0.6 : glowOpacity}
          filter="url(#glow)"
        >
          {isStreaming && (
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        
        {/* Main circle */}
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={size}
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth={isSelected ? 3 : 2}
        />
        
        {/* AI sparkle icon */}
        <g transform={`translate(${node.position.x - 8}, ${node.position.y - 8})`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="2">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
        </g>
        
        {/* Content preview */}
        {node.content && (
          <foreignObject
            x={node.position.x - 60}
            y={node.position.y + size + 5}
            width={120}
            height={60}
          >
            <div className="node-content-preview ai">
              {node.content.slice(0, 80)}{node.content.length > 80 ? '...' : ''}
            </div>
          </foreignObject>
        )}

        {/* Label */}
        {showLabel && (
          <text
            x={node.position.x}
            y={node.position.y - size - 10}
            fill={colors.border}
            fontSize="10"
            fontWeight={600}
            textAnchor="middle"
            style={{ opacity: isDimmed ? 0.3 : 1 }}
          >
            AI
          </text>
        )}
        
        {/* Streaming indicator */}
        {isStreaming && <StreamingIndicator x={node.position.x + size + 10} y={node.position.y} />}
      </g>
    )
  }

  // Default circle node for other types
  return (
    <g 
      className={`node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow */}
      <circle
        cx={node.position.x}
        cy={node.position.y}
        r={size + 10}
        fill={colors.glow}
        opacity={glowOpacity}
        filter="url(#glow)"
      />
      
      {/* Outer ring */}
      {(isSelected || isHighlighted) && (
        <circle
          cx={node.position.x}
          cy={node.position.y}
          r={size + 4}
          fill="none"
          stroke={colors.border}
          strokeWidth={2}
        />
      )}
      
      {/* Main circle */}
      <circle
        cx={node.position.x}
        cy={node.position.y}
        r={size}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={isSelected ? 3 : 2}
      />
      
      {/* Inner dot */}
      <circle
        cx={node.position.x}
        cy={node.position.y}
        r={size * 0.35}
        fill={colors.border}
      />

      {/* Label */}
      {showLabel && (
        <text
          x={node.position.x}
          y={node.position.y + size + 16}
          fill="white"
          fontSize="12"
          fontWeight={isSelected ? 600 : 400}
          textAnchor="middle"
          style={{ opacity: isDimmed ? 0.3 : 1 }}
        >
          {node.label}
        </text>
      )}
      
      {/* Streaming indicator */}
      {isStreaming && <StreamingIndicator x={node.position.x + size + 8} y={node.position.y} />}
    </g>
  )
}


// Streaming indicator component
function StreamingIndicator({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y - 10})`}>
      {/* Typing animation dots */}
      <circle cx={0} cy={0} r={3} fill="#64b5f6">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={8} cy={0} r={3} fill="#64b5f6">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1s"
          begin="0.2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={16} cy={0} r={3} fill="#64b5f6">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1s"
          begin="0.4s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  )
}
