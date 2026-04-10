// Simple IPC handler using localStorage via renderer process
// This file is kept for compatibility but storage is now handled in renderer

export async function initializeDatabase(): Promise<void> {
  console.log('Storage initialized via localStorage in renderer process')
}

export async function closeDatabase(): Promise<void> {
  console.log('Storage connection closed')
}

export function queryDatabase(sql: string, params?: any[]): any {
  // Not used with localStorage implementation
  return null
}

export function runDatabase(sql: string, params?: any[]): { lastID: number; changes: number } {
  // Not used with localStorage implementation
  return { lastID: 0, changes: 0 }
}

export function getDatabase(sql: string, params?: any[]): any {
  // Not used with localStorage implementation
  return null
}

export function allDatabase(sql: string, params?: any[]): any[] {
  // Not used with localStorage implementation
  return []
}
