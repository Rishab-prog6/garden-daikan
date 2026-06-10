import { useCallback, useEffect, useRef, useState } from 'react'
import type { GardenState, Plant } from '../types'
import { loadState, saveState } from '../lib/storage'
import { daysWaiting, nowOf, CRIT_DAYS, DAY, wiltingPlants, dateKey, wiltSummary } from '../lib/garden'
import type { ParsedItem } from '../lib/parse'
import { fireReminder, requestNotificationPermission, notificationPermission } from '../lib/reminders'

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

  // setState 的 updater 不保证同步执行，所以 toast 文案要在 setState 之前
  // 用当前 state 算好。stateRef 让 finish 不用把 state 放进依赖。
  const stateRef = useRef(state)
  stateRef.current = state

  /** 看完一株 → 开花 + 涨经验 + 续 streak。返回提示文案给 toast 用 */
  const finish = useCallback((id: number): string | null => {
    const s = stateRef.current
    const now = nowOf(s)
    const target = s.plants.find((p) => p.id === id)
    if (!target || target.watchedAt) return null
    const revived = daysWaiting(target, now) >= CRIT_DAYS
    const gain = revived ? 25 : 10

    // 今天第一次浇水才续火：昨天浇过 → +1，断档 → 重新从 1 烧
    const todayKey = dateKey(now)
    const prevStreak = s.streak ?? { count: 0, lastDoneOn: null }
    const firstToday = prevStreak.lastDoneOn !== todayKey
    const newStreak = firstToday
      ? {
          count: prevStreak.lastDoneOn === dateKey(now - DAY) ? prevStreak.count + 1 : 1,
          lastDoneOn: todayKey,
        }
      : prevStreak

    setState((prev) => {
      const t = prev.plants.find((p) => p.id === id)
      if (!t || t.watchedAt) return prev // 已经开过花就不重复涨经验
      return {
        ...prev,
        plants: prev.plants.map((p) => (p.id === id ? { ...p, watchedAt: now } : p)),
        xp: prev.xp + gain,
        streak: newStreak,
      }
    })
    const base = revived ? '起死回生！这株快枯了被你救回来 +25 XP' : '开花了 🌸  +10 XP'
    return firstToday ? `${base} · 🔥 连续浇水 ${newStreak.count} 天` : base
  }, [])

  const remove = useCallback((id: number) => {
    setState((s) => ({ ...s, plants: s.plants.filter((p) => p.id !== id) }))
  }, [])

  const fastForward = useCallback((days: number) => {
    setState((s) => ({ ...s, demoOffset: s.demoOffset + days * DAY }))
  }, [])

  const reset = useCallback(
    () => setState({
      plants: [],
      xp: 0,
      demoOffset: 0,
      reminders: { enabled: false, lastNotifiedOn: null },
      streak: { count: 0, lastDoneOn: null },
    }),
    [],
  )

  /** 给一株草排/改/取消档期（ts 传 null 表示取消） */
  const setPlannedFor = useCallback((id: number, ts: number | null) => {
    setState((s) => ({
      ...s,
      plants: s.plants.map((p) => (p.id === id ? { ...p, plannedFor: ts ?? undefined } : p)),
    }))
  }, [])

  /** 开/关枯萎提醒。开启时顺手请求通知权限 */
  const setRemindersEnabled = useCallback(async (on: boolean) => {
    if (on) await requestNotificationPermission()
    setState((s) => ({
      ...s,
      reminders: { enabled: on, lastNotifiedOn: s.reminders?.lastNotifiedOn ?? null },
    }))
  }, [])

  // 每天首次打开（或演示快进跨天）时，如果有草在枯且今天还没提醒过，弹一条桌面通知
  useEffect(() => {
    const r = state.reminders
    if (!r?.enabled) return
    if (notificationPermission() !== 'granted') return
    const now = nowOf(state)
    const { wilt, crit } = wiltingPlants(state.plants, now)
    if (wilt.length + crit.length === 0) return
    const key = dateKey(now)
    if (r.lastNotifiedOn === key) return
    fireReminder('你的花园在喊渴 🥀', `${wiltSummary(wilt.length, crit.length)} —— 今天救几株?`)
    setState((s) => ({ ...s, reminders: { ...s.reminders!, lastNotifiedOn: key } }))
    // 只在花园内容 / 演示偏移 / 开关变化时重新评估，避免每次渲染都触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.plants, state.demoOffset, state.reminders?.enabled])

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

  /** 点「去B站看」出门时打个戳（真实时间，不掺演示偏移） */
  const markVisited = useCallback((id: number) => {
    setState((s) => ({ ...s, plants: s.plants.map((p) => (p.id === id ? { ...p, visitedAt: Date.now() } : p)) }))
  }, [])

  /** 回来确认完毕（无论看没看完），清掉出门戳，别反复问 */
  const clearVisited = useCallback((id: number) => {
    setState((s) => ({ ...s, plants: s.plants.map((p) => (p.id === id ? { ...p, visitedAt: undefined } : p)) }))
  }, [])

  /** 手动标观看进度（0-100）。到 100 由调用方走 finish 开花 */
  const setProgress = useCallback((id: number, pct: number) => {
    const v = Math.max(0, Math.min(100, Math.round(pct)))
    setState((s) => ({
      ...s,
      plants: s.plants.map((p) => (p.id === id && !p.watchedAt ? { ...p, progress: v } : p)),
    }))
  }, [])

  /** 用备份整体恢复花园（备份已经过 parseBackup 清洗） */
  const restore = useCallback((s: GardenState) => setState(s), [])

  return {
    state, addPlant, finish, remove, fastForward, reset, importMany,
    setRemindersEnabled, setPlannedFor, restore, markVisited, clearVisited, setProgress,
  }
}
