import { describe, expect, it } from 'vitest'
import { officialDreams } from '../../src/data/dreams'
import { applyChoice, createInitialRun, getCurrentEnding, validateDreamGraph } from '../../src/lib/game'
import { decodeSharedDream, encodeSharedDream } from '../../src/lib/share'
import { dreamLevelSchema } from '../../src/lib/schemas'

describe('DreamLevel schema', () => {
  it('accepts every official dream', () => {
    for (const dream of officialDreams) {
      expect(dreamLevelSchema.safeParse(dream).success).toBe(true)
      expect(validateDreamGraph(dream).ok).toBe(true)
    }
  })

  it('rejects malformed dreams', () => {
    const malformed = { ...officialDreams[0], nodes: [] }
    expect(dreamLevelSchema.safeParse(malformed).success).toBe(false)
  })

  it('accepts a playable custom historical figure dream', () => {
    const customDream = {
      ...officialDreams[0],
      id: 'local-custom-su-shi',
      source: 'local',
      figureId: 'custom-su-shi',
      figureName: '苏轼',
      era: '北宋',
      tags: ['自定义', '词人'],
      cover: 'covers/zhugeliang.svg',
    }

    const parsed = dreamLevelSchema.safeParse(customDream)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(validateDreamGraph(parsed.data).ok).toBe(true)

    const decoded = decodeSharedDream(encodeSharedDream(parsed.data))
    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(decoded.dream.figureName).toBe('苏轼')
  })
})

describe('game engine', () => {
  it('applies choice effects and advances nodes', () => {
    const dream = officialDreams.find((item) => item.id === 'official-zhugeliang')!
    const run = createInitialRun(dream)
    const next = applyChoice(dream, run, 'c1')
    expect(next.currentNodeId).toBe('n2')
    expect(next.stats.courage).toBeGreaterThan(run.stats.courage)
    expect(next.history).toHaveLength(1)
    expect(next.history[0].result).toContain('草庐门开')
  })

  it('reaches an ending', () => {
    const dream = officialDreams.find((item) => item.id === 'official-zhugeliang')!
    let run = createInitialRun(dream)
    for (const choiceId of ['c1', 'c1', 'c1', 'c1', 'c1', 'c3']) {
      run = applyChoice(dream, run, choiceId)
    }
    expect(getCurrentEnding(dream, run)?.id).toBe('e4')
  })
})

describe('share links', () => {
  it('round-trips a dream through URL-safe compression', () => {
    const dream = officialDreams[0]
    const encoded = encodeSharedDream(dream)
    const decoded = decodeSharedDream(encoded)
    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(decoded.dream.title).toBe(dream.title)
  })

  it('rejects damaged share payloads', () => {
    expect(decodeSharedDream('not-a-real-dream').ok).toBe(false)
  })
})
