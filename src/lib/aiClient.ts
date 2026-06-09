import { dreamLevelSchema } from './schemas'
import { validateDreamGraph } from './game'
import type { DreamLevel, GenerateDreamRequest } from '../types'

export async function generateDream(request: GenerateDreamRequest): Promise<DreamLevel> {
  const endpoint = import.meta.env.VITE_AI_PROXY_URL || '/api/generate-dream'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      figure: {
        id: request.figure.id,
        name: request.figure.name,
        era: request.figure.era,
        tags: request.figure.tags,
        summary: request.figure.summary,
        cover: request.figure.cover,
      },
      theme: request.theme,
      style: request.style,
      length: request.length,
      notes: request.notes,
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || 'AI 代理请求失败。请检查 VITE_AI_PROXY_URL。')
  }

  const parsed = dreamLevelSchema.safeParse(payload?.dream)
  if (!parsed.success) throw new Error('AI 返回的梦境结构不符合 schema。')

  const graph = validateDreamGraph(parsed.data)
  if (!graph.ok) throw new Error(graph.error ?? 'AI 生成的梦境图结构不可玩。')
  return parsed.data
}
