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
  /** 打算哪天看（时间戳，天精度）；可选，没排期就没有 */
  plannedFor?: number
}

/** 枯萎提醒设置（#2）。可选，老数据没有也不影响 */
export interface ReminderState {
  /** 用户是否开启了枯萎提醒 */
  enabled: boolean
  /** 上次发桌面通知的“日期”（YYYY-M-D，按演示偏移后的现在算），用于每天最多提一次 */
  lastNotifiedOn: string | null
}

export interface GardenState {
  plants: Plant[]
  xp: number
  /** 演示模式累加的时间偏移（毫秒），仅用于录屏时把时间快进 */
  demoOffset: number
  /** 枯萎提醒设置；可选，保持向后兼容 */
  reminders?: ReminderState
}
