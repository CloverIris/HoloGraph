import { useState, useEffect, useRef, useCallback } from 'react'
import { useGraphStore } from '@stores/graphStore'
import './InlineEditor.css'

interface InlineEditorProps {
  nodeId: string
  initialContent?: string
  onSave?: () => void
  onCancel?: () => void
}

export function InlineEditor({ nodeId, initialContent = '', onSave, onCancel }: InlineEditorProps) {
  const [content, setContent] = useState(initialContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { updateNode, getNodeById } = useGraphStore()
  
  const node = getNodeById(nodeId)
  if (!node) return null

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px'
    }
  }, [content])

  // 自动聚焦
  useEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [])

  const handleSave = useCallback(async () => {
    if (content.trim()) {
      await updateNode(nodeId, {
        content: content.trim(),
        label: generateLabel(content.trim()),
      })
      onSave?.()
    }
  }, [content, nodeId, updateNode, onSave])

  const handleCancel = useCallback(() => {
    onCancel?.()
  }, [onCancel])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <div className="inline-editor">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入你的想法..."
        rows={1}
      />
      <div className="editor-toolbar">
        <span className="editor-hint">
          Enter 保存 · Shift+Enter 换行 · Esc 取消
        </span>
        <div className="editor-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            取消
          </button>
          <button className="btn-save" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// 生成标签（提取第一行或前20个字符）
function generateLabel(content: string): string {
  const firstLine = content.split('\n')[0].trim()
  if (firstLine.length <= 25) return firstLine
  return firstLine.slice(0, 25) + '...'
}
