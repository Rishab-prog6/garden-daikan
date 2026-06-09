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
