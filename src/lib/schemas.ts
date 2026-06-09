import { z } from 'zod'

export const figureIdSchema = z.enum([
  'confucius',
  'quyuan',
  'zhugeliang',
  'libai',
  'yuefei',
  'wangyangming',
])

export const statBlockSchema = z.object({
  wisdom: z.number().int().min(0).max(100),
  courage: z.number().int().min(0).max(100),
  sanity: z.number().int().min(0).max(100),
  reputation: z.number().int().min(0).max(100),
  fate: z.number().int().min(0).max(100),
})

const effectBlockSchema = z.object({
  wisdom: z.number().int().min(-20).max(20),
  courage: z.number().int().min(-20).max(20),
  sanity: z.number().int().min(-20).max(20),
  reputation: z.number().int().min(-20).max(20),
  fate: z.number().int().min(-20).max(20),
})

export const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(40),
  intent: z.string().min(1).max(80),
  targetId: z.string().min(1),
  preview: z.string().min(1).max(90),
  effects: effectBlockSchema.partial(),
})

export const dreamNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(40),
  body: z.string().min(1).max(520),
  choices: z.array(choiceSchema).min(2).max(4),
})

export const dreamEndingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(40),
  body: z.string().min(1).max(360),
  tone: z.enum(['bright', 'tragic', 'quiet', 'warning']),
})

export const dreamLevelSchema = z.object({
  schemaVersion: z.literal('dream-level-v1'),
  id: z.string().min(1),
  source: z.enum(['official', 'ai', 'local', 'shared']),
  title: z.string().min(1).max(50),
  summary: z.string().min(1).max(180),
  figureId: figureIdSchema,
  figureName: z.string().min(1).max(10),
  era: z.string().min(1).max(20),
  cover: z.string().min(1),
  tags: z.array(z.string().min(1).max(12)).min(1).max(6),
  initialStats: statBlockSchema,
  startNodeId: z.string().min(1),
  nodes: z.array(dreamNodeSchema).min(3).max(12),
  endings: z.array(dreamEndingSchema).min(3).max(6),
})

export const savedDreamSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  dream: dreamLevelSchema,
})

export const savedDreamsSchema = z.array(savedDreamSchema)

export type DreamLevelInput = z.input<typeof dreamLevelSchema>
