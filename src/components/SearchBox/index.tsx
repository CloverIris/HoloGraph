import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Sparkles, Command } from 'lucide-react'
import { useGraphStore } from '@stores/graphStore'
import { useUIStore } from '@stores/uiStore'
import type { KnowledgeNode } from '@mytypes'
import './SearchBox.css'

export function SearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KnowledgeNode[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { nodes, selectNode, setViewBox } = useGraphStore()
  const { setSearchQuery } = useUIStore()

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    
    setIsSearching(true)
    try {
      // Client-side search
      const filtered = nodes.filter((n) =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setResults(filtered.slice(0, 8))
    } catch (error) {
      // Clear results on error
      const filtered = nodes.filter((n) =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setResults(filtered.slice(0, 8))
    }
    setIsSearching(false)
    setSelectedIndex(0)
  }, [nodes])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 150)
    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle result selection
  const handleSelect = (node: KnowledgeNode) => {
    selectNode(node.id)
    setViewBox({
      x: node.position.x - 400,
      y: node.position.y - 300,
    })
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSearchQuery('')
    inputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="search-box" ref={containerRef}>
      <div className="search-input-container">
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search knowledge nodes..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            className="clear-btn"
            onClick={() => {
              setQuery('')
              setResults([])
              inputRef.current?.focus()
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <div className="keyboard-shortcut">
            <Command size={12} />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div className="search-dropdown">
          {isSearching ? (
            <div className="search-loading">
              <div className="spinner" />
              <span>Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              {query ? (
                <>
                  <Search size={32} className="empty-icon" />
                  <p>No results found for "{query}"</p>
                </>
              ) : (
                <>
                  <Sparkles size={32} className="empty-icon" />
                  <p>Type to search your knowledge graph</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="results-list">
                {results.map((node, index) => (
                  <button
                    key={node.id}
                    className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelect(node)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={`result-icon type-${node.type}`}>
                      {getTypeIcon(node.type)}
                    </div>
                    <div className="result-content">
                      <span className="result-label">{node.label}</span>
                      <span className="result-type">{getTypeLabel(node.type)}</span>
                    </div>
                    <div className="result-tags">
                      {node.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="result-tag">{tag}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              
              {query && (
                <div className="search-footer">
                  <div className="search-tips">
                    <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
                    <span><kbd>Enter</kbd> Select</span>
                    <span><kbd>Esc</kbd> Close</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    concept: '💡',
    note: '📝',
    code: '💻',
    idea: '✨',
    tweet: '🐦',
    reference: '📚',
  }
  return icons[type] || '📄'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    concept: 'Concept',
    note: 'Note',
    code: 'Code',
    idea: 'Idea',
    tweet: 'Tweet',
    reference: 'Reference',
  }
  return labels[type] || 'Other'
}
