import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { dreamLevelSchema } from './schemas'
import type { DreamLevel } from '../types'

export function encodeSharedDream(dream: DreamLevel) {
  return compressToEncodedURIComponent(JSON.stringify(dream))
}

export function decodeSharedDream(encoded: string):
  | { ok: true; dream: DreamLevel }
  | { ok: false; error: string } {
  try {
    const raw = decompressFromEncodedURIComponent(encoded)
    if (!raw) return { ok: false, error: '链接内容无法解压。' }
    const parsed = dreamLevelSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return { ok: false, error: '梦境结构不符合当前版本。' }
    return { ok: true, dream: parsed.data }
  } catch {
    return { ok: false, error: '链接内容已损坏。' }
  }
}

export async function copyShareLink(url: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return
  }

  const input = document.createElement('textarea')
  input.value = url
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}
