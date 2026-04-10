export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  
  return formatDate(timestamp)
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function getRandomColor(): string {
  const colors = [
    '#64b5f6', '#90caf9', '#bbdefb',
    '#4fc3f7', '#29b6f6', '#039be5',
    '#80deea', '#4dd0e1', '#00bcd4',
    '#9ccc65', '#aed581', '#c5e1a5',
    '#ffa726', '#ffb74d', '#ffcc80',
    '#ec407a', '#f06292', '#f48fb1',
    '#ab47bc', '#ba68c8', '#ce93d8',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 60%)`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function parseSearchQuery(query: string): {
  terms: string[]
  tags: string[]
  type?: string
} {
  const terms: string[] = []
  const tags: string[] = []
  let type: string | undefined
  
  const tagMatches = query.match(/tag:(\w+)/g)
  if (tagMatches) {
    tags.push(...tagMatches.map((m) => m.replace('tag:', '')))
  }
  
  const typeMatch = query.match(/type:(\w+)/)
  if (typeMatch) {
    type = typeMatch[1]
  }
  
  const cleanQuery = query
    .replace(/tag:\w+/g, '')
    .replace(/type:\w+/g, '')
    .trim()
  
  if (cleanQuery) {
    terms.push(...cleanQuery.split(/\s+/))
  }
  
  return { terms, tags, type }
}

export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return distance(px, py, cx, cy) <= radius
}

export function generateCurvePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 0.5
): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  
  const c1x = mx - dy * curvature
  const c1y = my + dx * curvature
  
  return `M ${x1} ${y1} Q ${c1x} ${c1y} ${x2} ${y2}`
}

export function exportToJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function validateNode(node: {
  label?: string
  content?: string
  type?: string
}): { valid: boolean; error?: string } {
  if (!node.label?.trim()) {
    return { valid: false, error: 'Title is required' }
  }
  
  if (node.label.length > 100) {
    return { valid: false, error: 'Title must be less than 100 characters' }
  }
  
  if (node.content && node.content.length > 10000) {
    return { valid: false, error: 'Content must be less than 10000 characters' }
  }
  
  const validTypes = ['concept', 'note', 'code', 'idea', 'tweet', 'reference']
  if (node.type && !validTypes.includes(node.type)) {
    return { valid: false, error: 'Invalid type' }
  }
  
  return { valid: true }
}
