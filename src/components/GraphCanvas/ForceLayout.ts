// Force-directed layout algorithm for the knowledge graph
import type { KnowledgeNode, KnowledgeEdge } from '@mytypes'

interface ForceLayoutOptions {
  width: number
  height: number
  iterations?: number
  repulsion?: number
  springLength?: number
  springStrength?: number
  damping?: number
  centerStrength?: number
}

interface NodeWithVelocity extends KnowledgeNode {
  vx: number
  vy: number
  fx?: number | null
  fy?: number | null
}

export class ForceLayout {
  private nodes: NodeWithVelocity[]
  private edges: KnowledgeEdge[]
  private options: Required<ForceLayoutOptions>

  constructor(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options: ForceLayoutOptions
  ) {
    this.nodes = nodes.map((n) => ({
      ...n,
      vx: 0,
      vy: 0,
    })) as NodeWithVelocity[]
    this.edges = edges
    this.options = {
      iterations: 300,
      repulsion: 1000,
      springLength: 100,
      springStrength: 0.05,
      damping: 0.9,
      centerStrength: 0.01,
      ...options,
    }
  }

  /**
   * Run the force simulation
   */
  simulate(): KnowledgeNode[] {
    const { iterations } = this.options

    for (let i = 0; i < iterations; i++) {
      this.applyForces()
      this.updatePositions()
    }

    return this.nodes.map(({ vx, vy, ...node }) => node as KnowledgeNode)
  }

  /**
   * Calculate and apply all forces
   */
  private applyForces(): void {
    this.applyRepulsion()
    this.applySprings()
    this.applyCenterForce()
  }

  /**
   * Repulsion force between all node pairs
   */
  private applyRepulsion(): void {
    const { repulsion } = this.options

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i]
        const nodeB = this.nodes[j]

        const dx = nodeB.position.x - nodeA.position.x
        const dy = nodeB.position.y - nodeA.position.y
        const distSq = dx * dx + dy * dy

        if (distSq === 0) continue

        const dist = Math.sqrt(distSq)
        const force = repulsion / distSq

        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        if (nodeA.fx === undefined || nodeA.fx === null) nodeA.vx -= fx
        if (nodeA.fy === undefined || nodeA.fy === null) nodeA.vy -= fy
        if (nodeB.fx === undefined || nodeB.fx === null) nodeB.vx += fx
        if (nodeB.fy === undefined || nodeB.fy === null) nodeB.vy += fy
      }
    }
  }

  /**
   * Spring force along edges
   */
  private applySprings(): void {
    const { springLength, springStrength } = this.options

    for (const edge of this.edges) {
      const source = this.nodes.find((n) => n.id === edge.source)
      const target = this.nodes.find((n) => n.id === edge.target)

      if (!source || !target) continue

      const dx = target.position.x - source.position.x
      const dy = target.position.y - source.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist === 0) continue

      const displacement = dist - springLength
      const force = displacement * springStrength * edge.strength

      const fx = (dx / dist) * force
      const fy = (dy / dist) * force

      if (source.fx === undefined || source.fx === null) source.vx += fx
      if (source.fy === undefined || source.fy === null) source.vy += fy
      if (target.fx === undefined || target.fx === null) target.vx -= fx
      if (target.fy === undefined || target.fy === null) target.vy -= fy
    }
  }

  /**
   * Center force pulling nodes to the center
   */
  private applyCenterForce(): void {
    const { width, height, centerStrength } = this.options
    const centerX = width / 2
    const centerY = height / 2

    for (const node of this.nodes) {
      const dx = centerX - node.position.x
      const dy = centerY - node.position.y

      if (node.fx === undefined || node.fx === null) node.vx += dx * centerStrength
      if (node.fy === undefined || node.fy === null) node.vy += dy * centerStrength
    }
  }

  /**
   * Update positions based on velocity
   */
  private updatePositions(): void {
    const { damping } = this.options

    for (const node of this.nodes) {
      if (node.fx !== undefined && node.fx !== null) {
        node.position.x = node.fx
        node.vx = 0
      } else {
        node.position.x += node.vx
        node.vx *= damping
      }

      if (node.fy !== undefined && node.fy !== null) {
        node.position.y = node.fy
        node.vy = 0
      } else {
        node.position.y += node.vy
        node.vy *= damping
      }
    }
  }

  /**
   * Step the simulation by one iteration (for animation)
   */
  step(): KnowledgeNode[] {
    this.applyForces()
    this.updatePositions()
    return this.nodes.map(({ vx, vy, ...node }) => node as KnowledgeNode)
  }
}

/**
 * Simple hook for running force layout
 */
export function useForceLayout(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[],
  enabled: boolean = true
): KnowledgeNode[] {
  if (!enabled) return nodes

  const layout = new ForceLayout(nodes, edges, {
    width: 1400,
    height: 900,
    iterations: 100,
  })

  return layout.simulate()
}
