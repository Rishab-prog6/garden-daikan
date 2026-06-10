import { useMemo, useState } from 'react'
import type { Plant } from '../types'
import { dateKey, critAt, startOfDay } from '../lib/garden'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface DayItems {
  planned: Plant[]
  dying: Plant[]
}

function ItemLabel({ plant, kind }: { plant: Plant; kind: 'planned' | 'dying' }) {
  const icon = kind === 'planned' ? '🌱' : '🥀'
  const text = `${icon} ${plant.title}`
  const hint = kind === 'planned' ? `安排了看：${plant.title}` : `这天就枯死了：${plant.title}`
  if (!plant.link) return <span className={'cal-item ' + kind} title={hint}>{text}</span>
  return (
    <a className={'cal-item ' + kind} href={plant.link} target="_blank" rel="noreferrer" title={hint + '（点了去看）'}>
      {text}
    </a>
  )
}

export function CalendarView({ plants, now }: { plants: Plant[]; now: number }) {
  // 看的是哪个月（相对当前月的偏移）
  const [offset, setOffset] = useState(0)
  const base = new Date(now)
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const year = first.getFullYear()
  const month = first.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // 周一开头要空几格

  // 排期和枯死预告按“哪一天”分组；看完的草两边都不掺和
  const byDay = useMemo(() => {
    const map = new Map<string, DayItems>()
    const bucket = (k: string): DayItems => {
      let b = map.get(k)
      if (!b) { b = { planned: [], dying: [] }; map.set(k, b) }
      return b
    }
    for (const p of plants) {
      if (p.watchedAt) continue
      if (p.plannedFor) bucket(dateKey(p.plannedFor)).planned.push(p)
      bucket(dateKey(critAt(p))).dying.push(p)
    }
    return map
  }, [plants])

  const todayKey = dateKey(now)
  const todayStart = startOfDay(now)

  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal">
      <div className="cal-head">
        <h2>{year} 年 {month + 1} 月</h2>
        <div className="cal-nav">
          <button onClick={() => setOffset((o) => o - 1)} title="上个月">‹</button>
          {offset !== 0 && <button onClick={() => setOffset(0)}>回到本月</button>}
          <button onClick={() => setOffset((o) => o + 1)} title="下个月">›</button>
        </div>
      </div>
      <div className="cal-week">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={'pad' + i} className="cal-cell pad" />
          const cellTs = new Date(year, month, d, 12).getTime()
          const key = dateKey(cellTs)
          const items = byDay.get(key)
          const isToday = key === todayKey
          const isPast = startOfDay(cellTs) < todayStart
          return (
            <div key={key} className={'cal-cell' + (isToday ? ' today' : '') + (isPast ? ' past' : '')}>
              <span className="cal-day">{d}{isToday && <i>今天</i>}</span>
              {items?.planned.map((p) => <ItemLabel key={'p' + p.id} plant={p} kind="planned" />)}
              {items?.dying.map((p) => <ItemLabel key={'d' + p.id} plant={p} kind="dying" />)}
            </div>
          )
        })}
      </div>
      <p className="cal-legend">🌱 安排了看 · 🥀 再不看这天就枯死 · 点卡片上的 📅 可以排档期</p>
    </div>
  )
}
