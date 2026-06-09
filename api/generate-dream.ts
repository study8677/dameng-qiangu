type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (key: string, value: string) => void
}

type FigureInput = {
  id: string
  name: string
  era: string
  cover: string
}

const allowedFigures = new Map<string, FigureInput>([
  ['confucius', { id: 'confucius', name: '孔子', era: '春秋', cover: 'covers/confucius.svg' }],
  ['quyuan', { id: 'quyuan', name: '屈原', era: '战国', cover: 'covers/quyuan.svg' }],
  ['zhugeliang', { id: 'zhugeliang', name: '诸葛亮', era: '三国', cover: 'covers/zhugeliang.svg' }],
  ['libai', { id: 'libai', name: '李白', era: '唐', cover: 'covers/libai.svg' }],
  ['yuefei', { id: 'yuefei', name: '岳飞', era: '宋', cover: 'covers/yuefei.svg' }],
  ['wangyangming', { id: 'wangyangming', name: '王阳明', era: '明', cover: 'covers/wangyangming.svg' }],
])

const dreamSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'id',
    'source',
    'title',
    'summary',
    'figureId',
    'figureName',
    'era',
    'cover',
    'tags',
    'initialStats',
    'startNodeId',
    'nodes',
    'endings',
  ],
  properties: {
    schemaVersion: { type: 'string', enum: ['dream-level-v1'] },
    id: { type: 'string' },
    source: { type: 'string', enum: ['ai'] },
    title: { type: 'string' },
    summary: { type: 'string' },
    figureId: { type: 'string', pattern: '^(confucius|quyuan|zhugeliang|libai|yuefei|wangyangming|custom-[a-z0-9-]+)$' },
    figureName: { type: 'string' },
    era: { type: 'string' },
    cover: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    initialStats: {
      type: 'object',
      additionalProperties: false,
      required: ['wisdom', 'courage', 'sanity', 'reputation', 'fate'],
      properties: {
        wisdom: { type: 'integer' },
        courage: { type: 'integer' },
        sanity: { type: 'integer' },
        reputation: { type: 'integer' },
        fate: { type: 'integer' },
      },
    },
    startNodeId: { type: 'string' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'body', 'choices'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'label', 'intent', 'targetId', 'preview', 'result', 'effects'],
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                intent: { type: 'string' },
                targetId: { type: 'string' },
                preview: { type: 'string' },
                result: { type: 'string' },
                effects: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['wisdom', 'courage', 'sanity', 'reputation', 'fate'],
                  properties: {
                    wisdom: { type: 'integer' },
                    courage: { type: 'integer' },
                    sanity: { type: 'integer' },
                    reputation: { type: 'integer' },
                    fate: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    endings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'body', 'tone'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          tone: { type: 'string', enum: ['bright', 'tragic', 'quiet', 'warning'] },
        },
      },
    },
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST is supported.' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the AI proxy.' })
    return
  }

  const body = normalizeBody(req.body)
  const figure = resolveFigure(body.figure)
  if (!figure.ok) {
    res.status(400).json({ error: figure.error })
    return
  }

  const { id: figureId, name: figureName, era, cover } = figure.value
  const theme = getString(body.theme) || '功业未竟'
  const style = getString(body.style) || '庄严'
  const length = getString(body.length) || '短篇'
  const notes = getString(body.notes) || '无'
  const dreamId = `ai-${figureId}-${Date.now()}`

  const prompt = [
    '你是一个中文历史互动梦境游戏策划。',
    '请只生成清朝以前历史伟人的互动梦境关卡，不要生成清朝及以后人物、现代政治人物、色情、仇恨、极端暴力或无关题材。',
    '输出必须符合 JSON Schema。不要输出 Markdown。',
    `人物：${figureName}，朝代：${era}，人物ID：${figureId}，封面：${cover}。`,
    `梦境主题：${theme}。叙事风格：${style}。长度：${length}。补充设定：${notes}。`,
    `固定字段：id 必须是 ${dreamId}，source 必须是 ai，figureId/figureName/era/cover 必须使用上面的值。`,
    '关卡要求：5到7个 nodes；每个 node 2到4个 choices；至少3个 endings；startNodeId 必须指向第一个 node；choice.targetId 必须指向某个 node 或 ending；choice.result 必须写出玩家做出选择后的具体戏剧性后果。',
    '数值要求：initialStats 每项 35-75；effects 每项 -12 到 12；fate 表示天命偏差，冒险选择可增加。',
  ].join('\n')

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: [
          { role: 'system', content: '你只输出符合 schema 的中文互动梦境 JSON。' },
          { role: 'user', content: prompt },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'dream_level',
            strict: true,
            schema: dreamSchema,
          },
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || 'OpenAI request failed.' })
      return
    }

    const output = extractOutputText(data)
    if (!output) {
      res.status(502).json({ error: 'OpenAI response did not include JSON output.' })
      return
    }

    const dream = normalizeGeneratedDream(JSON.parse(output), {
      dreamId,
      figureId,
      figureName,
      era,
      cover,
    })
    res.status(200).json({ dream })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI proxy failed.'
    res.status(500).json({ error: message })
  }
}

function resolveFigure(rawFigure: unknown):
  | { ok: true; value: FigureInput }
  | { ok: false; error: string } {
  const figure = isRecord(rawFigure) ? rawFigure : {}
  const figureId = getString(figure.id)
  const official = allowedFigures.get(figureId)
  if (official) return { ok: true, value: official }

  const name = getString(figure.name)
  const era = getString(figure.era)
  if (!name) return { ok: false, error: 'Custom historical figure name is required.' }
  if (!era) return { ok: false, error: 'Custom historical figure era is required.' }
  if (name.length > 24) return { ok: false, error: 'Custom historical figure name is too long.' }
  if (era.length > 20) return { ok: false, error: 'Custom historical figure era is too long.' }
  if (isPostQingEra(era)) {
    return { ok: false, error: 'Only pre-Qing historical figures are supported in this MVP.' }
  }

  return {
    ok: true,
    value: {
      id: isCustomFigureId(figureId) ? figureId : makeCustomFigureId(name, era),
      name,
      era,
      cover: 'covers/zhugeliang.svg',
    },
  }
}

function normalizeBody(body: unknown): Record<string, unknown> {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return isRecord(body) ? body : {}
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCustomFigureId(value: string) {
  return /^custom-[a-z0-9-]+$/.test(value)
}

function makeCustomFigureId(name: string, era: string) {
  const seed = `${name}-${era}`.trim() || 'figure'
  const encoded = Array.from(seed)
    .map((char) => char.codePointAt(0)?.toString(36) ?? '')
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '')
  return `custom-${encoded || 'figure'}`
}

function isPostQingEra(era: string) {
  return /(清|民国|近代|现代|当代|共和国|新中国|中华人民共和国)/.test(era)
}

function normalizeGeneratedDream(
  dream: unknown,
  fixed: {
    dreamId: string
    figureId: string
    figureName: string
    era: string
    cover: string
  },
) {
  if (!isRecord(dream)) return dream
  return {
    ...dream,
    id: fixed.dreamId,
    source: 'ai',
    figureId: fixed.figureId,
    figureName: fixed.figureName,
    era: fixed.era,
    cover: fixed.cover,
  }
}

function extractOutputText(data: unknown): string {
  if (!isRecord(data)) return ''
  if (typeof data.output_text === 'string') return data.output_text
  const output = data.output
  if (!Array.isArray(output)) return ''
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === 'string') return content.text
    }
  }
  return ''
}
