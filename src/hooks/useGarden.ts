import { useCallback, useEffect, useRef, useState } from 'react'
import type { GardenState, Plant } from '../types'
import { loadState, saveState } from '../lib/storage'
import { daysWaiting, nowOf, CRIT_DAYS, DAY } from '../lib/garden'
import type { ParsedItem } from '../lib/parse'

function seed(): Plant[] {
  // 首次打开给几株不同枯萎程度的草，演示/录屏时画面不空
  const base = Date.now()
  return [
    { id: 1, title: '《三体》动画解说合集（共 8 集）', link: '', addedAt: base - 9 * DAY, watchedAt: null },
    { id: 2, title: '30 分钟搞懂 Transformer 注意力机制', link: '', addedAt: base - 5 * DAY, watchedAt: null },
    { id: 3, title: '宿舍党也能做的 5 道快手菜', link: '', addedAt: base - 1 * DAY, watchedAt: null },
    { id: 4, title: '从零开始学 Blender 建模', link: '', addedAt: base - 12 * DAY, watchedAt: null },
  ]
}

export function useGarden() {
  const [state, setState] = useState<GardenState>(() => {
    const s = loadState()
    if (s.plants.length === 0) s.plants = seed()
    return s
  })

  // 防抖落盘
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => saveState(state), 150)
    return () => window.clearTimeout(timer.current)
  }, [state])

  const addPlant = useCallback((title: string, link = '') => {
    const t = title.trim()
    if (!t) return
    setState((s) => ({
      ...s,
      plants: [
        { id: Date.now() + Math.random(), title: t, link: link.trim(), addedAt: nowOf(s), watchedAt: null },
        ...s.plants,
      ],
    }))
  }, [])

  /** 看完一株 → 开花 + 涨经验。返回提示文案给 toast 用 */
  const finish = useCallback((id: number): string | null => {
    let msg: string | null = null
    setState((s) => {
      const now = nowOf(s)
      const plants = s.plants.map((p) => {
        if (p.id !== id || p.watchedAt) return p
        const revived = daysWaiting(p, now) >= CRIT_DAYS
        msg = revived ? '起死回生！这株快枯了被你救回来 +25 XP' : '开花了 🌸  +10 XP'
        return { ...p, watchedAt: now }
      })
      const target = s.plants.find((p) => p.id === id)
      const gain = target && daysWaiting(target, now) >= CRIT_DAYS ? 25 : 10
      const grew = target && !target.watchedAt
      return { ...s, plants, xp: s.xp + (grew ? gain : 0) }
    })
    return msg
  }, [])

  const remove = useCallback((id: number) => {
    setState((s) => ({ ...s, plants: s.plants.filter((p) => p.id !== id) }))
  }, [])

  const fastForward = useCallback((days: number) => {
    setState((s) => ({ ...s, demoOffset: s.demoOffset + days * DAY }))
  }, [])

  const reset = useCallback(() => setState({ plants: [], xp: 0, demoOffset: 0 }), [])

  /** 批量导入，返回 { planted, skipped } */
  const importMany = useCallback((items: ParsedItem[]): { planted: number; skipped: number } => {
    let planted = 0
    let skipped = 0
    setState((s) => {
      const now = nowOf(s)
      const existingBvids = new Set(s.plants.map((p) => p.bvid).filter(Boolean) as string[])
      const existingTitles = new Set(s.plants.map((p) => p.title))
      const newPlants: Plant[] = []

      for (const item of items) {
        if (item.bvid && existingBvids.has(item.bvid)) { skipped++; continue }
        if (!item.bvid && existingTitles.has(item.title)) { skipped++; continue }
        planted++
        if (item.bvid) existingBvids.add(item.bvid)
        existingTitles.add(item.title)
        newPlants.push({
          id: now + Math.random() + planted,
          title: item.title,
          link: item.link,
          bvid: item.bvid,
          addedAt: now,
          watchedAt: null,
        })
      }
      return { ...s, plants: [...newPlants, ...s.plants] }
    })
    return { planted, skipped }
  }, [])

  return { state, addPlant, finish, remove, fastForward, reset, importMany }
}
