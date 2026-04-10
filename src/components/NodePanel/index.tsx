import { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  Plus, 
  Clock,
  Network,
  Sparkles,
  GitBranch,
  MessageSquare,
  FileText,
  Lightbulb,
  Loader2
} from 'lucide-react'
import { useGraphStore } from '@stores/graphStore'
import { useUIStore } from '@stores/uiStore'
import { useSessionStore } from '@stores/sessionStore'
import { aiService, streamingUpdater } from '@services/aiService'
import { ConversationBreadcrumb, ThreadNavigator } from '@components/ConversationNav'
import type { NodeType, KnowledgeNode } from '@mytypes'
import './NodePanel.css'

const nodeTypes: { value: NodeType; label: string; color: string }[] = [
  { value: 'concept', label: 'Concept', color: '#64b5f6' },
  { value: 'note', label: 'Note', color: '#9ccc65' },
  { value: 'code', label: 'Code', color: '#ffa726' },
  { value: 'idea', label: 'Idea', color: '#ec407a' },
  { value: 'tweet', label: 'Tweet', color: '#29b6f6' },
  { value: 'reference', label: 'Reference', color: '#ab47bc' },
]

export function NodePanel() {
  const { toggleRightPanel } = useUIStore()
  const { getActiveSession } = useSessionStore()
  const { 
    nodes, 
    selectedNodeId,
    selectNode,
    createEdge,
    getNodeNeighbors,
    createAIResponseNode,
    createBranchNode,
    getConversationThread,
  } = useGraphStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editedNode, setEditedNode] = useState<Partial<KnowledgeNode>>({})
  const [newTag, setNewTag] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'connections' | 'ai' | 'thread'>('details')
  
  // AI states
  const [isAskingAI, setIsAskingAI] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{
    summary?: string
    keyPoints?: string[]
    actionItems?: string[]
  } | null>(null)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const neighbors = selectedNode ? getNodeNeighbors(selectedNode.id) : { nodes: [], edges: [] }

  useEffect(() => {
    if (selectedNode) {
      setEditedNode(selectedNode)
      setIsEditing(false)
    }
  }, [selectedNode])

  if (selectedNodeId === 'new') {
    return <NewNodePanel onClose={() => selectNode(null)} />
  }

  if (!selectedNode) {
    return (
      <div className="node-panel">
        <div className="panel-header">
          <h2>Node Details</h2>
          <button className="btn-icon" onClick={toggleRightPanel}>
            <X size={20} />
          </button>
        </div>
        <div className="empty-state">
          <Network size={48} className="empty-state-icon" />
          <h3>Select a Node</h3>
          <p>Click on a node in the graph to view details</p>
        </div>
      </div>
    )
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    const currentTags = editedNode.tags || selectedNode.tags
    if (!currentTags.includes(newTag.trim())) {
      setEditedNode({
        ...editedNode,
        tags: [...currentTags, newTag.trim()],
      })
    }
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    const currentTags = editedNode.tags || selectedNode.tags
    setEditedNode({
      ...editedNode,
      tags: currentTags.filter((t: string) => t !== tag),
    })
  }

  const handleConnectTo = async (targetId: string) => {
    await createEdge({
      source: selectedNode.id,
      target: targetId,
      strength: 0.5,
      type: 'manual',
    })
  }

  return (
    <div className="node-panel">
      <div className="panel-header">
        <h2>Node Details</h2>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button className="btn-icon save-btn" onClick={() => setIsEditing(false)} title="Save">
                <Save size={18} />
              </button>
              <button 
                className="btn-icon" 
                onClick={() => {
                  setEditedNode(selectedNode)
                  setIsEditing(false)
                }}
                title="Cancel"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-icon" 
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                <span className="edit-icon">Edit</span>
              </button>
              <button className="btn-icon" onClick={toggleRightPanel} title="Close">
                <X size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="panel-tabs">
        <button 
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={activeTab === 'connections' ? 'active' : ''}
          onClick={() => setActiveTab('connections')}
        >
          Connections ({neighbors.nodes.length})
        </button>
        <button 
          className={activeTab === 'ai' ? 'active' : ''}
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles size={14} />
          AI
        </button>
        <button 
          className={activeTab === 'thread' ? 'active' : ''}
          onClick={() => setActiveTab('thread')}
        >
          <MessageSquare size={14} />
          Thread
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'details' && (
          <div className="tab-content">
            <div className="form-group">
              <label>Type</label>
              {isEditing ? (
                <div className="type-selector">
                  {nodeTypes.map((t) => (
                    <button
                      key={t.value}
                      className={`type-btn ${editedNode.type === t.value ? 'active' : ''}`}
                      style={{ '--type-color': t.color } as React.CSSProperties}
                      onClick={() => setEditedNode({ ...editedNode, type: t.value })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div 
                  className="type-badge"
                  style={{ 
                    backgroundColor: `${nodeTypes.find(t => t.value === selectedNode.type)?.color}20`,
                    color: nodeTypes.find(t => t.value === selectedNode.type)?.color 
                  }}
                >
                  {nodeTypes.find(t => t.value === selectedNode.type)?.label}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Title</label>
              {isEditing ? (
                <input
                  type="text"
                  className="input"
                  value={editedNode.label || ''}
                  onChange={(e) => setEditedNode({ ...editedNode, label: e.target.value })}
                />
              ) : (
                <h3 className="node-title">{selectedNode.label}</h3>
              )}
            </div>

            <div className="form-group">
              <label>Content</label>
              {isEditing ? (
                <textarea
                  className="textarea"
                  value={editedNode.content || ''}
                  onChange={(e) => setEditedNode({ ...editedNode, content: e.target.value })}
                  rows={6}
                />
              ) : (
                <div className="node-content">
                  {selectedNode.content || <em className="placeholder">No content</em>}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tags-container">
                {(isEditing ? editedNode.tags : selectedNode.tags)?.map((tag: string) => (
                  <span key={tag} className="tag">
                    {tag}
                    {isEditing && (
                      <button onClick={() => handleRemoveTag(tag)}>x</button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <div className="add-tag">
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <button onClick={handleAddTag}>
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="metadata">
              <div className="meta-item">
                <Clock size={14} />
                <span>Created: {new Date(selectedNode.createdAt).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <Clock size={14} />
                <span>Updated: {new Date(selectedNode.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="tab-content">
            <h4>Connected Nodes</h4>
            {neighbors.nodes.length === 0 ? (
              <p className="empty-text">No connections</p>
            ) : (
              <div className="connections-list">
                {neighbors.nodes.map((node) => {
                  const edge = neighbors.edges.find(
                    (e) => e.source === node.id || e.target === node.id
                  )
                  return (
                    <div key={node.id} className="connection-item">
                      <div className={`connection-icon type-${node.type}`}>
                        {node.type[0].toUpperCase()}
                      </div>
                      <div className="connection-info">
                        <span className="connection-label">{node.label}</span>
                        <span className="connection-type">
                          {edge?.label || edge?.type}
                        </span>
                      </div>
                      <div 
                        className="connection-strength"
                        style={{ opacity: edge?.strength || 0.5 }}
                      >
                        <GitBranch size={14} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <h4>Add Connection</h4>
            <div className="add-connection">
              <select 
                className="select"
                onChange={(e) => e.target.value && handleConnectTo(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select node to connect...</option>
                {nodes
                  .filter((n) => n.id !== selectedNode.id && !neighbors.nodes.find(nn => nn.id === n.id))
                  .map((n) => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AITabContent
            selectedNode={selectedNode}
            isAskingAI={isAskingAI}
            isSummarizing={isSummarizing}
            analysisResult={analysisResult}
            onAskAI={async () => {
              if (!selectedNode) return
              setIsAskingAI(true)
              try {
                const session = getActiveSession()
                const aiNode = await createAIResponseNode({
                  parentId: selectedNode.id,
                  sessionId: session?.id || '',
                })
                
                // Build context and stream
                const messages = aiService.buildContext(aiNode)
                await streamingUpdater.startStreaming(
                  aiNode.id,
                  messages,
                  aiNode.metadata?.aiConfig || {}
                )
              } catch (error) {
                console.error('Failed to ask AI:', error)
              } finally {
                setIsAskingAI(false)
              }
            }}
            onCreateBranch={async () => {
              if (!selectedNode) return
              const session = getActiveSession()
              await createBranchNode({
                parentId: selectedNode.id,
                sessionId: session?.id || '',
              })
            }}
            onSummarize={async () => {
              if (!selectedNode) return
              setIsSummarizing(true)
              try {
                const thread = getConversationThread(selectedNode.id)
                const summary = await aiService.generateSummary(thread)
                setAnalysisResult({ summary })
              } catch (error) {
                console.error('Failed to summarize:', error)
              } finally {
                setIsSummarizing(false)
              }
            }}
            onAnalyze={async () => {
              if (!selectedNode) return
              try {
                const result = await aiService.analyzeContent(selectedNode.content)
                setAnalysisResult({
                  summary: result.summary,
                  keyPoints: result.concepts,
                  actionItems: result.relatedConcepts,
                })
              } catch (error) {
                console.error('Failed to analyze:', error)
              }
            }}
          />
        )}
        
        {activeTab === 'thread' && selectedNodeId && (
          <div className="tab-content thread-tab">
            <ConversationBreadcrumb nodeId={selectedNodeId} />
            <ThreadNavigator nodeId={selectedNodeId} />
          </div>
        )}
      </div>
    </div>
  )
}

function NewNodePanel({ onClose }: { onClose: () => void }) {
  const { createNode, selectNode } = useGraphStore()
  const [nodeData, setNodeData] = useState<Partial<KnowledgeNode>>({
    label: '',
    content: '',
    type: 'concept',
    tags: [],
  })
  const [newTag, setNewTag] = useState('')

  const handleCreate = async () => {
    if (!nodeData.label?.trim()) return
    const newNode = await createNode({
      label: nodeData.label,
      content: nodeData.content || '',
      type: nodeData.type as NodeType,
      tags: nodeData.tags || [],
      position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
      metadata: {},
    })
    selectNode(newNode.id)
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    if (!nodeData.tags?.includes(newTag.trim())) {
      setNodeData({ ...nodeData, tags: [...(nodeData.tags || []), newTag.trim()] })
    }
    setNewTag('')
  }

  const nodeTypesList = [
    { value: 'concept' as NodeType, label: 'Concept', color: '#64b5f6' },
    { value: 'note' as NodeType, label: 'Note', color: '#9ccc65' },
    { value: 'code' as NodeType, label: 'Code', color: '#ffa726' },
    { value: 'idea' as NodeType, label: 'Idea', color: '#ec407a' },
    { value: 'tweet' as NodeType, label: 'Tweet', color: '#29b6f6' },
    { value: 'reference' as NodeType, label: 'Reference', color: '#ab47bc' },
  ]

  return (
    <div className="node-panel">
      <div className="panel-header">
        <h2>New Node</h2>
        <button className="btn-icon" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="panel-content">
        <div className="tab-content">
          <div className="form-group">
            <label>Type</label>
            <div className="type-selector">
              {nodeTypesList.map((t) => (
                <button
                  key={t.value}
                  className={`type-btn ${nodeData.type === t.value ? 'active' : ''}`}
                  style={{ '--type-color': t.color } as React.CSSProperties}
                  onClick={() => setNodeData({ ...nodeData, type: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              className="input"
              placeholder="Enter node title..."
              value={nodeData.label}
              onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              className="textarea"
              placeholder="Enter node content..."
              value={nodeData.content}
              onChange={(e) => setNodeData({ ...nodeData, content: e.target.value })}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-container">
              {nodeData.tags?.map((tag: string) => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => setNodeData({ 
                    ...nodeData, 
                    tags: nodeData.tags?.filter((t: string) => t !== tag) 
                  })}>
                    x
                  </button>
                </span>
              ))}
              <div className="add-tag">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button onClick={handleAddTag}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleCreate}
          disabled={!nodeData.label?.trim()}
        >
          Create Node
        </button>
      </div>
    </div>
  )
}


// AI Tab Content Component
interface AITabContentProps {
  selectedNode: KnowledgeNode
  isAskingAI: boolean
  isSummarizing: boolean
  analysisResult: {
    summary?: string
    keyPoints?: string[]
    actionItems?: string[]
  } | null
  onAskAI: () => void
  onCreateBranch: () => void
  onSummarize: () => void
  onAnalyze: () => void
}

function AITabContent({
  selectedNode,
  isAskingAI,
  isSummarizing,
  analysisResult,
  onAskAI,
  onCreateBranch,
  onSummarize,
  onAnalyze,
}: AITabContentProps) {
  return (
    <div className="tab-content ai-tab">
      {/* Quick Actions */}
      <div className="ai-section">
        <h4>Quick Actions</h4>
        <div className="ai-actions-grid">
          <button 
            className="btn-ai-action primary"
            onClick={onAskAI}
            disabled={isAskingAI}
          >
            {isAskingAI ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Sparkles size={18} />
            )}
            Ask AI
          </button>
          <button 
            className="btn-ai-action"
            onClick={onCreateBranch}
          >
            <GitBranch size={18} />
            Branch
          </button>
          <button 
            className="btn-ai-action"
            onClick={onSummarize}
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <FileText size={18} />
            )}
            Summarize
          </button>
          <button 
            className="btn-ai-action"
            onClick={onAnalyze}
          >
            <Lightbulb size={18} />
            Analyze
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="ai-section results">
          {analysisResult.summary && (
            <div className="result-item">
              <h5>Summary</h5>
              <p>{analysisResult.summary}</p>
            </div>
          )}
          
          {analysisResult.keyPoints && analysisResult.keyPoints.length > 0 && (
            <div className="result-item">
              <h5>Key Points</h5>
              <ul>
                {analysisResult.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysisResult.actionItems && analysisResult.actionItems.length > 0 && (
            <div className="result-item">
              <h5>Related Concepts</h5>
              <div className="tag-list">
                {analysisResult.actionItems.map((item, i) => (
                  <span key={i} className="tag">{item}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Node Info */}
      <div className="ai-section info">
        <h4>Node Info</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Type</span>
            <span className="info-value">{selectedNode.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status</span>
            <span className="info-value">{selectedNode.metadata?.status || 'idle'}</span>
          </div>
          {selectedNode.metadata?.aiResponse && (
            <>
              <div className="info-item">
                <span className="info-label">Model</span>
                <span className="info-value">{selectedNode.metadata.aiResponse.model}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tokens</span>
                <span className="info-value">{selectedNode.metadata.aiResponse.tokens?.total || 'N/A'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
