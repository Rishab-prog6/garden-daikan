// 解析用户从 B 站历史记录页带来的数据（Ctrl+A 复制文本 / Ctrl+S 保存的
// .html/.mhtml），提取每个视频的观看进度，和花园里的草匹配。
// 全部在本机浏览器里解析，不上传任何东西。
import type { Plant } from '../types'

export interface SyncItem {
  bvid?: string
  title: string
  /** 0-100 */
  pct: number
}

export interface SyncMatch {
  plantId: number
  title: string
  oldPct: number
  newPct: number
  /** 进度到头，直接开花 */
  willBloom: boolean
}

const BV_RE = /BV[A-Za-z0-9]{10}/
/** 04:44/16:06 或 02:08:55/04:03:27 */
const PROGRESS_RE = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s*\/\s*((?:\d{1,2}:)?\d{1,2}:\d{2})$/
/** 复制文本里的分组标题等杂质行 */
const SECTION_RE = /^(今天|昨天|前天|近一周|近一月|更早|历史记录)$/

function timeToSec(t: string): number {
  return t.split(':').reduce((acc, v) => acc * 60 + Number(v), 0)
}

/** 标题归一化：B 站同一标题在不同位置空格数量都可能不同 */
function normTitle(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

function pctFromProgressText(text: string): number | null {
  const t = text.trim()
  if (t === '已看完') return 100
  const m = t.match(PROGRESS_RE)
  if (!m) return null
  const dur = timeToSec(m[2])
  if (dur <= 0) return null
  return Math.min(100, Math.round((timeToSec(m[1]) / dur) * 100))
}

/** 解析 Ctrl+A 复制出来的纯文本：进度行的上一行就是标题 */
function parseText(raw: string): SyncItem[] {
  const lines = raw.split('\n').map((l) => l.trim())
  const items: SyncItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const pct = pctFromProgressText(lines[i])
    if (pct === null) continue
    const title = lines[i - 1]
    if (!title || SECTION_RE.test(title) || pctFromProgressText(title) !== null) continue
    items.push({ title, pct })
  }
  return items
}

/** 解析 Ctrl+S 保存的历史记录页 HTML：BV 在链接里，精确百分比在进度条样式里 */
function parseHtml(html: string): SyncItem[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items: SyncItem[] = []
  for (const a of Array.from(doc.querySelectorAll('a[href*="/video/BV"]'))) {
    const bv = (a.getAttribute('href') ?? '').match(BV_RE)
    if (!bv) continue
    const img = a.querySelector('img[alt]')
    const title = img?.getAttribute('alt')?.trim() ?? ''
    // 优先用进度条的精确百分比
    let pct: number | null = null
    const bar = a.querySelector('[class*="progress"]')
    const style = bar?.getAttribute('style') ?? ''
    const pm = style.match(/([\d.]+)%/)
    if (pm) pct = Math.min(100, Math.round(parseFloat(pm[1])))
    // 兜底：封面角落的文字（04:44/16:06 或 已看完）
    if (pct === null) {
      for (const span of Array.from(a.querySelectorAll('span'))) {
        const p = pctFromProgressText(span.textContent ?? '')
        if (p !== null) { pct = p; break }
      }
    }
    if (pct === null) continue
    items.push({ bvid: bv[0], title: title || bv[0], pct })
  }
  return items
}

/** mhtml 是 quoted-printable 包着的 HTML，先解出来 */
function decodeQuotedPrintable(s: string): string {
  const joined = s.replace(/=\r?\n/g, '')
  const bytes: number[] = []
  for (let i = 0; i < joined.length; i++) {
    const hex = joined.slice(i + 1, i + 3)
    if (joined[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16))
      i += 2
    } else {
      bytes.push(joined.charCodeAt(i) & 0xff)
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
}

/** 认格式 → 解析。同一视频出现多次取最大进度 */
export function parseWatchData(raw: string): SyncItem[] {
  let items: SyncItem[]
  if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(raw)) {
    items = parseHtml(decodeQuotedPrintable(raw))
  } else if (raw.includes('bili-video-card') || /<html|<!doctype/i.test(raw.slice(0, 2000))) {
    items = parseHtml(raw)
  } else {
    items = parseText(raw)
  }
  const best = new Map<string, SyncItem>()
  for (const it of items) {
    const key = it.bvid ?? normTitle(it.title)
    const prev = best.get(key)
    if (!prev || it.pct > prev.pct) best.set(key, it)
  }
  return [...best.values()]
}

/** 和花园里的草匹配：BV 优先，标题兜底；只升不降；≥95% 算看完 */
export function matchSync(plants: Plant[], items: SyncItem[]): { matches: SyncMatch[]; unmatched: number } {
  const byBv = new Map<string, Plant>()
  const byTitle = new Map<string, Plant>()
  for (const p of plants) {
    if (p.watchedAt) continue
    if (p.bvid) byBv.set(p.bvid, p)
    byTitle.set(normTitle(p.title), p)
  }
  const matches: SyncMatch[] = []
  let unmatched = 0
  for (const it of items) {
    const plant = (it.bvid && byBv.get(it.bvid)) || byTitle.get(normTitle(it.title))
    if (!plant) { unmatched++; continue }
    const oldPct = plant.progress ?? 0
    if (it.pct <= oldPct) { continue } // 进度只升不降，没变化就不打扰
    matches.push({
      plantId: plant.id,
      title: plant.title,
      oldPct,
      newPct: it.pct,
      willBloom: it.pct >= 95,
    })
  }
  return { matches, unmatched }
}
