import type { GardenState } from '../types'
import { currentStreak, daysWaiting, isWilting } from './garden'

export interface Achievement {
  id: string
  title: string
  desc: string
  done: boolean
  progress: string
}

export function buildAchievements(state: GardenState, now: number): Achievement[] {
  const total = state.plants.length
  const bloomed = state.plants.filter((p) => p.watchedAt).length
  const wilting = state.plants.filter((p) => isWilting(p, now) && !p.watchedAt).length
  const revived = state.plants.filter((p) => p.watchedAt && daysWaiting(p, p.watchedAt) >= 7).length
  const planned = state.plants.filter((p) => p.plannedFor && !p.watchedAt).length
  const streak = currentStreak(state.streak, now)

  return [
    {
      id: 'first-bloom',
      title: '第一朵花',
      desc: '看完任意一个待看视频',
      done: bloomed >= 1,
      progress: `${Math.min(bloomed, 1)}/1`,
    },
    {
      id: 'rescue',
      title: '濒危抢救员',
      desc: '救回一株拖了 7 天以上的草',
      done: revived >= 1,
      progress: `${Math.min(revived, 1)}/1`,
    },
    {
      id: 'planner',
      title: '排期园丁',
      desc: '给 3 个视频安排观看日期',
      done: planned >= 3,
      progress: `${Math.min(planned, 3)}/3`,
    },
    {
      id: 'streak',
      title: '三日浇水',
      desc: '连续 3 天让花园有进展',
      done: streak >= 3,
      progress: `${Math.min(streak, 3)}/3`,
    },
    {
      id: 'collector',
      title: '收藏夹减肥',
      desc: '累计种下 10 个视频',
      done: total >= 10,
      progress: `${Math.min(total, 10)}/10`,
    },
    {
      id: 'alarm',
      title: '枯萎警报',
      desc: '花园里出现需要拯救的视频',
      done: wilting > 0,
      progress: wilting > 0 ? `${wilting} 株` : '0 株',
    },
  ]
}
