import { dreamLevelSchema, savedDreamsSchema } from './schemas'
import type { DreamLevel } from '../types'

const STORAGE_KEY = 'dameng-qiangu:saved-dreams:v1'

export type SavedDream = {
  id: string
  createdAt: string
  dream: DreamLevel
}

export function getSavedDreams(): SavedDream[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = savedDreamsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export function saveGeneratedDream(dream: DreamLevel): SavedDream {
  const parsed = dreamLevelSchema.parse(dream)
  const saved: SavedDream = {
    id: parsed.id,
    createdAt: new Date().toISOString(),
    dream: parsed,
  }
  const next = [saved, ...getSavedDreams().filter((item) => item.id !== saved.id)].slice(0, 30)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return saved
}

export function deleteSavedDream(id: string) {
  const next = getSavedDreams().filter((item) => item.id !== id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
