import { useMemo } from 'react'
import { useGraphStore } from '@stores/graphStore'
import { MessageSquare, GitBranch, CornerDownRight } from 'lucide-react'
import './ConversationNav.css'

interface ConversationBreadcrumbProps {
  nodeId: string
}

export function ConversationBreadcrumb({ nodeId }: ConversationBreadcrumbProps) {
  const { getConversationThread, selectNode } = useGraphStore()
  
  const thread = useMemo(() => {
    return getConversationThread(nodeId)
  }, [nodeId, getConversationThread])
  
  if (thread.length <= 1) return null
  
  return (
    <div className="conversation-breadcrumb">
      {thread.map((node, index) => {
        const isCurrent = node.id === nodeId
        const isLast = index === thread.length - 1
        
        return (
          <div key={node.id} className="breadcrumb-item-wrapper">
            <button
              className={`breadcrumb-item ${isCurrent ? 'current' : ''}`}
              onClick={() => selectNode(node.id)}
            >
              {node.type === 'ai-response' ? (
                <MessageSquare size={12} />
              ) : node.type === 'branch' ? (
                <GitBranch size={12} />
              ) : (
                <CornerDownRight size={12} />
              )}
              <span className="breadcrumb-label">
                {node.label.slice(0, 15)}{node.label.length > 15 ? '...' : ''}
              </span>
            </button>
            {!isLast && (
              <span className="breadcrumb-separator">→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface ThreadNavigatorProps {
  nodeId: string
}

export function ThreadNavigator({ nodeId }: ThreadNavigatorProps) {
  const {
    getNodeById,
    getNodeParent,
    getNodeSiblings,
    getNodeChildren,
    selectNode,
  } = useGraphStore()
  
  const node = getNodeById(nodeId)
  const parent = getNodeParent(nodeId)
  const siblings = getNodeSiblings(nodeId)
  const children = getNodeChildren(nodeId)
  
  if (!node) return null
  
  return (
    <div className="thread-navigator">
      {/* Parent */}
      {parent && (
        <div className="nav-section">
          <span className="nav-label">Parent</span>
          <NodeButton node={parent} onClick={() => selectNode(parent.id)} />
        </div>
      )}
      
      {/* Siblings */}
      {siblings.length > 0 && (
        <div className="nav-section">
          <span className="nav-label">Siblings ({siblings.length})</span>
          <div className="nav-list">
            {siblings.map((sibling) => (
              <NodeButton
                key={sibling.id}
                node={sibling}
                onClick={() => selectNode(sibling.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Children */}
      {children.length > 0 && (
        <div className="nav-section">
          <span className="nav-label">Replies ({children.length})</span>
          <div className="nav-list">
            {children.map((child) => (
              <NodeButton
                key={child.id}
                node={child}
                onClick={() => selectNode(child.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface NodeButtonProps {
  node: { id: string; label: string; type: string; content?: string }
  onClick: () => void
}

function NodeButton({ node, onClick }: NodeButtonProps) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ai-response':
        return <MessageSquare size={14} />
      case 'branch':
        return <GitBranch size={14} />
      default:
        return <CornerDownRight size={14} />
    }
  }
  
  return (
    <button className="node-button" onClick={onClick}>
      <span className="node-icon">{getNodeIcon(node.type)}</span>
      <span className="node-label">
        {node.label.slice(0, 20)}{node.label.length > 20 ? '...' : ''}
      </span>
    </button>
  )
}
