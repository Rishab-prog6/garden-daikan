import type { GardenState } from '../types'

const KEY = 'daikan-garden:state'

export const EMPTY: GardenState = { plants: [], xp: 0, demoOffset: 0 }

export function loadState(): GardenState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<GardenState>
    return {
      plants: Array.isArray(parsed.plants) ? parsed.plants : [],
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      demoOffset: typeof parsed.demoOffset === 'number' ? parsed.demoOffset : 0,
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveState(state: GardenState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 隐私模式或配额满时静默失败，不影响使用 */
  }
}
