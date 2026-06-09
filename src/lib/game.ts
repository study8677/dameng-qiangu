import type { Choice, DreamLevel, PlayerRun, StatBlock } from '../types'

const statKeys = ['wisdom', 'courage', 'sanity', 'reputation', 'fate'] as const

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

export function createInitialRun(dream: DreamLevel): PlayerRun {
  return {
    dreamId: dream.id,
    currentNodeId: dream.startNodeId,
    stats: { ...dream.initialStats },
    history: [],
    endingId: null,
  }
}

export function getCurrentNode(dream: DreamLevel, run: PlayerRun) {
  if (run.endingId) return null
  return dream.nodes.find((node) => node.id === run.currentNodeId) ?? null
}

export function getCurrentEnding(dream: DreamLevel, run: PlayerRun) {
  if (!run.endingId) return null
  return dream.endings.find((ending) => ending.id === run.endingId) ?? null
}

export function applyChoice(dream: DreamLevel, run: PlayerRun, choiceId: string): PlayerRun {
  if (run.endingId) return run

  const node = getCurrentNode(dream, run)
  const choice = node?.choices.find((item) => item.id === choiceId)
  if (!node || !choice) return run

  const stats = applyEffects(run.stats, choice)
  const targetEnding = dream.endings.find((ending) => ending.id === choice.targetId)
  const targetNode = dream.nodes.find((nextNode) => nextNode.id === choice.targetId)

  return {
    ...run,
    currentNodeId: targetNode?.id ?? run.currentNodeId,
    stats,
    endingId: targetEnding?.id ?? null,
    history: [
      ...run.history,
      {
        nodeId: node.id,
        nodeTitle: node.title,
        choiceId: choice.id,
        choiceLabel: choice.label,
      },
    ],
  }
}

export function applyEffects(stats: StatBlock, choice: Choice): StatBlock {
  const next = { ...stats }
  for (const key of statKeys) {
    next[key] = clamp(next[key] + (choice.effects[key] ?? 0))
  }
  return next
}

export function validateDreamGraph(dream: DreamLevel) {
  const ids = new Set([...dream.nodes.map((node) => node.id), ...dream.endings.map((ending) => ending.id)])
  if (!ids.has(dream.startNodeId)) return { ok: false, error: 'startNodeId 不存在。' }

  for (const node of dream.nodes) {
    for (const choice of node.choices) {
      if (!ids.has(choice.targetId)) {
        return { ok: false, error: `${node.title} 的选项指向不存在的节点。` }
      }
    }
  }

  const reachable = new Set<string>()
  const queue = [dream.startNodeId]
  while (queue.length) {
    const id = queue.shift()
    if (!id || reachable.has(id)) continue
    reachable.add(id)
    const node = dream.nodes.find((item) => item.id === id)
    if (node) {
      for (const choice of node.choices) queue.push(choice.targetId)
    }
  }

  const reachableEndingCount = dream.endings.filter((ending) => reachable.has(ending.id)).length
  if (reachableEndingCount < 3) return { ok: false, error: '至少需要 3 个可到达结局。' }
  return { ok: true, error: null }
}

export function getEndingProgressLabel(dream: DreamLevel, run: PlayerRun) {
  const maxSteps = Math.max(...dream.nodes.map((node) => node.choices.length), 1)
  return `第 ${run.history.length + 1} 念 · ${dream.endings.length} 个结局 · ${maxSteps} 种抉择`
}
