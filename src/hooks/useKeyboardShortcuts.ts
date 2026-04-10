import { useEffect } from 'react'

interface ShortcutHandlers {
  onNewNode?: () => void
  onSave?: () => void
  onSearch?: () => void
  onDelete?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = e.target as HTMLElement
      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      
      if (isInput) {
        // Only handle Escape in input fields
        if (e.key === 'Escape' && handlers.onEscape) {
          handlers.onEscape()
        }
        return
      }

      const isMeta = e.metaKey || e.ctrlKey

      switch (e.key.toLowerCase()) {
        case 'n':
          if (isMeta && handlers.onNewNode) {
            e.preventDefault()
            handlers.onNewNode()
          }
          break
        case 's':
          if (isMeta && handlers.onSave) {
            e.preventDefault()
            handlers.onSave()
          }
          break
        case 'k':
          if (isMeta && handlers.onSearch) {
            e.preventDefault()
            handlers.onSearch()
          }
          break
        case 'delete':
        case 'backspace':
          if (handlers.onDelete && !isInput) {
            handlers.onDelete()
          }
          break
        case 'escape':
          if (handlers.onEscape) {
            handlers.onEscape()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}

// Hook for managing focus trap in modals/panels
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [containerRef, isActive])
}

// Hook for detecting clicks outside an element
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, handler, isActive])
}

// Hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Hook for localStorage with state
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

import { useState } from 'react'
