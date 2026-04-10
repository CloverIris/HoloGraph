import { useRef, useState, useCallback } from 'react'
import { useGraphStore } from '@stores/graphStore'
import { useUIStore } from '@stores/uiStore'
import type { KnowledgeNode, KnowledgeEdge } from '@mytypes'
import './GraphCanvas.css'

// Node colors
const nodeColors: Record<string, { bg: string; border: string; glow: string }> = {
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

  const { 
    nodes, 
    edges, 
    selectedNodeId, 
    viewBox, 
    setViewBox, 
    selectNode, 
    updateNode,
    getNodeNeighbors,
    resetView
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

  return (
    <div 
      ref={containerRef}
      className="graph-canvas"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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

            return (
              <NodeCircle
                key={node.id}
                node={node}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isHovered={isHovered}
                isDimmed={isDimmed}
                showLabel={showLabels}
                onClick={() => selectNode(node.id)}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  setDragNode(node.id)
                  setIsDragging(true)
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              />
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
  const colors = nodeColors[node.type] || nodeColors.concept
  const size = isSelected ? 26 : isHighlighted ? 24 : 20
  const glowOpacity = isSelected ? 0.8 : isHovered ? 0.5 : 0.3

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
    </g>
  )
}
