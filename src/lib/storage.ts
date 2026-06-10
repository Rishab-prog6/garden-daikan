import type { GardenState } from '../types'

const KEY = 'daikan-garden:state'

export const EMPTY: GardenState = {
  plants: [],
  xp: 0,
  demoOffset: 0,
  reminders: { enabled: false, lastNotifiedOn: null },
  streak: { count: 0, lastDoneOn: null },
}

export function loadState(): GardenState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<GardenState>
    const r = parsed.reminders
    const st = parsed.streak
    return {
      plants: Array.isArray(parsed.plants) ? parsed.plants : [],
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      demoOffset: typeof parsed.demoOffset === 'number' ? parsed.demoOffset : 0,
      reminders: r && typeof r === 'object'
        ? {
            enabled: !!r.enabled,
            lastNotifiedOn: typeof r.lastNotifiedOn === 'string' ? r.lastNotifiedOn : null,
          }
        : { enabled: false, lastNotifiedOn: null },
      streak: st && typeof st === 'object'
        ? {
            count: typeof st.count === 'number' ? st.count : 0,
            lastDoneOn: typeof st.lastDoneOn === 'string' ? st.lastDoneOn : null,
          }
        : { count: 0, lastDoneOn: null },
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
