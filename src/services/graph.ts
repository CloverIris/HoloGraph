import type { KnowledgeNode, KnowledgeEdge, PathResult } from '@mytypes'

export const graphAlgorithms = {
  findShortestPath(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    fromId: string,
    toId: string
  ): PathResult | null {
    if (fromId === toId || !fromId || !toId) {
      const node = nodes.find((n) => n.id === fromId)
      return node ? { nodes: [node], edges: [], distance: 0, path: [fromId] } : null
    }

    const adj = new Map<string, Array<{ to: string; edge: KnowledgeEdge; weight: number }>>()
    
    edges.forEach((edge) => {
      const weight = 1 - edge.strength
      
      if (!adj.has(edge.source)) adj.set(edge.source, [])
      if (!adj.has(edge.target)) adj.set(edge.target, [])
      
      adj.get(edge.source)!.push({ to: edge.target, edge, weight })
      adj.get(edge.target)!.push({ to: edge.source, edge, weight })
    })

    const dist = new Map<string, number>()
    const prev = new Map<string, { node: string; edge: KnowledgeEdge } | null>()
    const unvisited = new Set<string>()

    nodes.forEach((n) => {
      dist.set(n.id, n.id === fromId ? 0 : Infinity)
      prev.set(n.id, null)
      unvisited.add(n.id)
    })

    while (unvisited.size > 0) {
      let current: string | null = null
      let minDist = Infinity
      
      unvisited.forEach((nodeId) => {
        const d = dist.get(nodeId)!
        if (d < minDist) {
          minDist = d
          current = nodeId
        }
      })

      if (current === null || dist.get(current) === Infinity) break
      if (current === toId) break

      unvisited.delete(current)
      
      const currentNodeId: string = current
      
      const neighbors = adj.get(currentNodeId) || []
      neighbors.forEach(({ to, weight, edge }) => {
        if (!unvisited.has(to)) return
        
        const alt = dist.get(currentNodeId)! + weight
        if (alt < dist.get(to)!) {
          dist.set(to, alt)
          prev.set(to, { node: currentNodeId, edge })
        }
      })
    }

    if (dist.get(toId) === Infinity) return null

    const pathNodes: KnowledgeNode[] = []
    const pathEdges: KnowledgeEdge[] = []
    let current = toId

    while (current !== fromId) {
      const node = nodes.find((n) => n.id === current)
      if (node) pathNodes.unshift(node)
      
      const prevInfo = prev.get(current)
      if (!prevInfo) break
      
      pathEdges.unshift(prevInfo.edge)
      current = prevInfo.node
    }

    const startNode = nodes.find((n) => n.id === fromId)
    if (startNode) pathNodes.unshift(startNode)

    return {
      nodes: pathNodes,
      edges: pathEdges,
      distance: dist.get(toId) || 0,
      path: pathNodes.map((n) => n.id),
    }
  },

  getNeighbors(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    nodeId: string
  ): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const connectedEdges = edges.filter(
      (e) => e.source === nodeId || e.target === nodeId
    )
    
    const neighborIds = new Set<string>()
    connectedEdges.forEach((e) => {
      if (e.source === nodeId) neighborIds.add(e.target)
      if (e.target === nodeId) neighborIds.add(e.source)
    })

    const neighborNodes = nodes.filter((n) => neighborIds.has(n.id))

    return {
      nodes: neighborNodes,
      edges: connectedEdges,
    }
  },

  calculateCentrality(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Map<string, number> {
    const centrality = new Map<string, number>()
    
    nodes.forEach((n) => centrality.set(n.id, 0))
    
    edges.forEach((e) => {
      centrality.set(e.source, (centrality.get(e.source) || 0) + 1)
      centrality.set(e.target, (centrality.get(e.target) || 0) + 1)
    })

    return centrality
  },

  findClusters(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Map<string, string[]> {
    const clusters = new Map<string, string[]>()
    const visited = new Set<string>()
    let clusterId = 0

    const dfs = (nodeId: string, cluster: string[]) => {
      visited.add(nodeId)
      cluster.push(nodeId)

      const connectedEdges = edges.filter(
        (e) => e.source === nodeId || e.target === nodeId
      )

      connectedEdges.forEach((e) => {
        const neighborId = e.source === nodeId ? e.target : e.source
        if (!visited.has(neighborId)) {
          dfs(neighborId, cluster)
        }
      })
    }

    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        const cluster: string[] = []
        dfs(n.id, cluster)
        clusters.set(`cluster-${clusterId++}`, cluster)
      }
    })

    return clusters
  },

  findDarkMatter(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    threshold: number = 2
  ): KnowledgeNode[] {
    const centrality = this.calculateCentrality(nodes, edges)
    
    return nodes.filter((n) => {
      const degree = centrality.get(n.id) || 0
      return degree > 0 && degree <= threshold
    })
  },

  suggestConnections(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    nodeId: string,
    maxSuggestions: number = 5
  ): Array<{ nodeId: string; score: number; reason: string }> {
    const neighbors = this.getNeighbors(nodes, edges, nodeId)
    const neighborIds = new Set(neighbors.nodes.map((n) => n.id))
    
    const suggestions = new Map<string, { sharedNeighbors: Set<string>; score: number }>()

    neighbors.nodes.forEach((neighbor) => {
      const secondDegree = this.getNeighbors(nodes, edges, neighbor.id)
      secondDegree.nodes.forEach((secondNeighbor) => {
        if (secondNeighbor.id === nodeId) return
        if (neighborIds.has(secondNeighbor.id)) return

        const existing = suggestions.get(secondNeighbor.id)
        if (existing) {
          existing.sharedNeighbors.add(neighbor.id)
          existing.score += 1
        } else {
          suggestions.set(secondNeighbor.id, {
            sharedNeighbors: new Set([neighbor.id]),
            score: 1,
          })
        }
      })
    })

    return Array.from(suggestions.entries())
      .map(([targetId, data]) => ({
        nodeId: targetId,
        score: data.score,
        reason: `Via ${Array.from(data.sharedNeighbors).map((id) => 
          nodes.find((n) => n.id === id)?.label || id
        ).join(', ')}`,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
  },
}
