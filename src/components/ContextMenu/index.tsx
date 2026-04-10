import { useEffect, useRef } from 'react'
import { Edit, Sparkles, GitBranch, FileText, Trash2, Link, Copy } from 'lucide-react'
import type { KnowledgeNode } from '@mytypes'
import './ContextMenu.css'

export interface ContextMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  node: KnowledgeNode | null
  onClose: () => void
  onEdit: () => void
  onAskAI: () => void
  onCreateBranch: () => void
  onSummarize: () => void
  onConnect: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function ContextMenu({
  x,
  y,
  node,
  onClose,
  onEdit,
  onAskAI,
  onCreateBranch,
  onSummarize,
  onConnect,
  onDuplicate,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const items: ContextMenuItem[] = node
    ? [
        { id: 'edit', label: '编辑', icon: <Edit size={16} />, shortcut: 'Enter', action: onEdit },
        { id: 'ai', label: '询问 AI', icon: <Sparkles size={16} />, shortcut: 'Ctrl+Enter', action: onAskAI },
        { id: 'branch', label: '创建分支', icon: <GitBranch size={16} />, shortcut: 'Ctrl+B', action: onCreateBranch },
        { id: 'summarize', label: '总结此分支', icon: <FileText size={16} />, action: onSummarize },
        { id: 'connect', label: '连接节点', icon: <Link size={16} />, action: onConnect },
        { id: 'duplicate', label: '复制', icon: <Copy size={16} />, shortcut: 'Ctrl+D', action: onDuplicate },
        { id: 'delete', label: '删除', icon: <Trash2 size={16} />, shortcut: 'Delete', action: onDelete, danger: true },
      ]
    : [
        { id: 'create', label: '创建 Block', icon: <Edit size={16} />, action: onEdit },
      ]

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
          onClick={() => {
            if (!item.disabled) {
              item.action()
              onClose()
            }
          }}
          disabled={item.disabled}
        >
          <span className="item-icon">{item.icon}</span>
          <span className="item-label">{item.label}</span>
          {item.shortcut && <span className="item-shortcut">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  )
}
