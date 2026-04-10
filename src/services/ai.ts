import type { KnowledgeNode, KnowledgeEdge, AIAnalysisResult } from '@mytypes'

export const aiService = {
  async analyzeContent(content: string): Promise<AIAnalysisResult> {
    const mockResult: AIAnalysisResult = {
      concepts: this.extractConcepts(content),
      keywords: this.extractKeywords(content),
      summary: this.generateSummary(content),
      relatedConcepts: [],
      suggestedConnections: [],
    }

    return mockResult
  },

  async findConnections(
    sourceNode: KnowledgeNode,
    targetNodes: KnowledgeNode[]
  ): Promise<Array<{ nodeId: string; strength: number; reason: string }>> {
    const suggestions: Array<{ nodeId: string; strength: number; reason: string }> = []

    for (const target of targetNodes) {
      if (target.id === sourceNode.id) continue

      const similarity = this.calculateSimilarity(sourceNode, target)
      if (similarity > 0.3) {
        suggestions.push({
          nodeId: target.id,
          strength: similarity,
          reason: this.generateConnectionReason(sourceNode, target),
        })
      }
    }

    return suggestions.sort((a, b) => b.strength - a.strength)
  },

  async autoTag(content: string, existingTags: string[]): Promise<string[]> {
    const extractedTags = this.extractKeywords(content)
    const newTags = extractedTags.filter((tag) => !existingTags.includes(tag))
    return [...existingTags, ...newTags].slice(0, 8)
  },

  extractConcepts(text: string): string[] {
    const concepts: string[] = []
    const quoted = text.match(/"([^"]+)"/g) || []
    concepts.push(...quoted.map((q) => q.replace(/"/g, '')))
    const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    concepts.push(...capitalized)
    return [...new Set(concepts)].slice(0, 5)
  },

  extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    ])
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w))
    
    const freq = new Map<string, number>()
    words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1))
    
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  },

  generateSummary(text: string): string {
    if (text.length < 100) return text
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    if (sentences.length <= 2) return text.slice(0, 200) + '...'
    return sentences.slice(0, 2).join('').slice(0, 200) + '...'
  },

  calculateSimilarity(nodeA: KnowledgeNode, nodeB: KnowledgeNode): number {
    let score = 0
    const commonTags = nodeA.tags.filter((t: string) => nodeB.tags.includes(t))
    score += commonTags.length * 0.3
    
    const wordsA = new Set(nodeA.content.toLowerCase().split(/\s+/))
    const wordsB = new Set(nodeB.content.toLowerCase().split(/\s+/))
    const commonWords = [...wordsA].filter((w) => wordsB.has(w))
    score += (commonWords.length / Math.max(wordsA.size, wordsB.size)) * 0.5
    
    if (nodeA.type === nodeB.type) score += 0.1
    
    if (nodeA.label.toLowerCase().includes(nodeB.label.toLowerCase()) ||
        nodeB.label.toLowerCase().includes(nodeA.label.toLowerCase())) {
      score += 0.1
    }
    
    return Math.min(1, score)
  },

  generateConnectionReason(nodeA: KnowledgeNode, nodeB: KnowledgeNode): string {
    const commonTags = nodeA.tags.filter((t: string) => nodeB.tags.includes(t))
    if (commonTags.length > 0) {
      return `Shared tags: ${commonTags.join(', ')}`
    }
    if (nodeA.type === nodeB.type) {
      return `Same type: ${nodeA.type}`
    }
    return 'Semantic similarity'
  },

  async findWormholes(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<Array<{ nodeA: string; nodeB: string; reason: string }>> {
    const wormholes: Array<{ nodeA: string; nodeB: string; reason: string }> = []
    const nodesByType = new Map<string, KnowledgeNode[]>()
    
    nodes.forEach((n) => {
      if (!nodesByType.has(n.type)) nodesByType.set(n.type, [])
      nodesByType.get(n.type)!.push(n)
    })
    
    const types = Array.from(nodesByType.keys())
    
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const typeA = types[i]
        const typeB = types[j]
        
        for (const nodeA of nodesByType.get(typeA) || []) {
          for (const nodeB of nodesByType.get(typeB) || []) {
            const alreadyConnected = edges.some(
              (e) =>
                (e.source === nodeA.id && e.target === nodeB.id) ||
                (e.source === nodeB.id && e.target === nodeA.id)
            )
            
            if (alreadyConnected) continue
            
            const similarity = this.calculateSimilarity(nodeA, nodeB)
            if (similarity > 0.4) {
              wormholes.push({
                nodeA: nodeA.id,
                nodeB: nodeB.id,
                reason: `Cross-domain: ${typeA} ↔ ${typeB}`,
              })
            }
          }
        }
      }
    }
    
    return wormholes
  },
}
