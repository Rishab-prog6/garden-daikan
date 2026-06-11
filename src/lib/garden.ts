import type { Plant, Status, GardenState } from '../types'

export const DAY = 86_400_000

/** 枯萎阈值（天）：<3 新鲜，3–6 枯萎中，>=7 快枯了 */
export const WILT_DAYS = 3
export const CRIT_DAYS = 7

export const SPRITE: Record<Status, string> = {
  fresh: '🌱',
  wilt: '🥀',
  crit: '🥀',
  bloom: '🌸',
}

/** 当前“现在”——真实时间加上演示偏移 */
export function nowOf(state: Pick<GardenState, 'demoOffset'>): number {
  return Date.now() + state.demoOffset
}

export function daysWaiting(p: Plant, now: number): number {
  return Math.floor((now - p.addedAt) / DAY)
}

export function statusOf(p: Plant, now: number): Status {
  if (p.watchedAt) return 'bloom'
  const d = daysWaiting(p, now)
  if (d >= CRIT_DAYS) return 'crit'
  if (d >= WILT_DAYS) return 'wilt'
  return 'fresh'
}

export function isWilting(p: Plant, now: number): boolean {
  const s = statusOf(p, now)
  return s === 'wilt' || s === 'crit'
}

/** 把待看的草按枯萎程度分组，给提醒用（#2） */
export function wiltingPlants(plants: Plant[], now: number): { wilt: Plant[]; crit: Plant[] } {
  const wilt: Plant[] = []
  const crit: Plant[] = []
  for (const p of plants) {
    const s = statusOf(p, now)
    if (s === 'crit') crit.push(p)
    else if (s === 'wilt') wilt.push(p)
  }
  return { wilt, crit }
}

/** “现在”是哪一天（按演示偏移后的本地日期），用于每天最多提醒一次 */
export function dateKey(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** 一句话概括有多少草在枯，提醒条和桌面通知共用 */
export function wiltSummary(wilt: number, crit: number): string {
  const parts: string[] = []
  if (wilt > 0) parts.push(`${wilt} 株在枯萎`)
  if (crit > 0) parts.push(`${crit} 株快枯死了`)
  return parts.join('、')
}

/** 当天零点（本地时区），天精度比较用 */
export function startOfDay(t: number): number {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** 这株草哪天枯死（到达 crit 的那天），给日历预告用 */
export function critAt(p: Plant): number {
  return p.addedAt + CRIT_DAYS * DAY
}

/** 排期爽约了几天；没排期/已看完/还没到期都返回 0 */
export function daysOverdue(p: Plant, now: number): number {
  if (!p.plannedFor || p.watchedAt) return 0
  return Math.max(0, Math.round((startOfDay(now) - startOfDay(p.plannedFor)) / DAY))
}

/** 短日期文案：6/14 */
export function fmtDay(t: number): string {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 今日浇水清单：最该救的草排前面（快枯 > 在枯 > 等最久），最多 n 株 */
export function todayPicks(plants: Plant[], now: number, n = 3): Plant[] {
  const order: Record<Status, number> = { crit: 0, wilt: 1, fresh: 2, bloom: 3 }
  return plants
    .filter((p) => !p.watchedAt)
    .sort((a, b) => order[statusOf(a, now)] - order[statusOf(b, now)] || a.addedAt - b.addedAt)
    .slice(0, n)
}

/** 信号点形态（替代 emoji 精灵）：返回 .sdot 的修饰类名 */
export function dotClassOf(p: Plant, now: number): Status | 'grow' {
  const st = statusOf(p, now)
  if (st === 'fresh' && (p.progress ?? 0) > 0) return 'grow'
  return st
}

/** 药丸/缩影上显示的形态：枯了优先 🥀，看了一部分长成 🌿（分享卡缩影还在用） */
export function spriteOf(p: Plant, now: number): string {
  const st = statusOf(p, now)
  if (st === 'bloom') return '🌸'
  if (st === 'wilt' || st === 'crit') return '🥀'
  return (p.progress ?? 0) > 0 ? '🌿' : '🌱'
}

/** 当前有效 streak：最近一次浇水不是今天也不是昨天，火就灭了 */
export function currentStreak(s: { count: number; lastDoneOn: string | null } | undefined, now: number): number {
  if (!s?.lastDoneOn) return 0
  const today = dateKey(now)
  const yesterday = dateKey(now - DAY)
  return s.lastDoneOn === today || s.lastDoneOn === yesterday ? s.count : 0
}

/** 经验 → 等级。曲线越往后越慢 */
export function level(xp: number): number {
  return Math.floor(Math.sqrt(xp / 12)) + 1
}

export function xpInLevel(xp: number): { lv: number; cur: number; span: number } {
  const lv = level(xp)
  const base = (lv - 1) * (lv - 1) * 12
  const next = lv * lv * 12
  return { lv, cur: xp - base, span: next - base }
}
