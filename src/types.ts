export type Status = 'fresh' | 'wilt' | 'crit' | 'bloom'

export interface Plant {
  id: number
  title: string
  link: string
  /** 种下的时间戳（含演示偏移后的”现在”） */
  addedAt: number
  /** 看完的时间戳；null 表示还没看 */
  watchedAt: number | null
  /** B 站 BV 号，可选；用于去重 */
  bvid?: string
}

export interface GardenState {
  plants: Plant[]
  xp: number
  /** 演示模式累加的时间偏移（毫秒），仅用于录屏时把时间快进 */
  demoOffset: number
}
