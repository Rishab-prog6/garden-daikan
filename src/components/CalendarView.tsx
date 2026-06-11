import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import type { Plant } from '../types'
import { dateKey, critAt, startOfDay, dotClassOf } from '../lib/garden'
import { buildIcs } from '../lib/ics'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface Props {
  plants: Plant[]
  now: number
  onPlan: (id: number, ts: number | null) => void
  onNotice: (msg: string) => void
  /** 点条目/药丸 → 打开详情 */
  onOpen: (id: number) => void
}

interface DayItems {
  planned: Plant[]
  dying: Plant[]
}

function ItemLabel({
  plant, kind, onDragStart, onOpen,
}: {
  plant: Plant
  kind: 'planned' | 'dying'
  onDragStart?: (e: DragEvent) => void
  onOpen: (id: number) => void
}) {
  const hint = kind === 'planned'
    ? `安排了看：${plant.title}（点开详情，拖动可改期）`
    : `这天就枯死了：${plant.title}（点开详情）`
  // 只有排期条目可拖（枯死预告是命运，不是日程，拖不动）
  const drag = kind === 'planned' ? { draggable: true, onDragStart } : {}
  return (
    <span className={'cal-item ' + kind} title={hint} onClick={() => onOpen(plant.id)} {...drag}>
      <i className={'sdot ' + (kind === 'planned' ? 'plan' : 'crit')} /> {plant.title}
    </span>
  )
}

export function CalendarView({ plants, now, onPlan, onNotice, onOpen }: Props) {
  // 看的是哪个月（相对当前月的偏移）
  const [offset, setOffset] = useState(0)
  // 拖拽正悬停在哪（格子的 dateKey 或 'tray'），用来高亮落点
  const [overKey, setOverKey] = useState<string | null>(null)

  const base = new Date(now)
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const year = first.getFullYear()
  const month = first.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // 周一开头要空几格

  const unplanned = plants.filter((p) => !p.watchedAt && !p.plannedFor)
  const bloomed = plants.filter((p) => p.watchedAt)

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

  const dragStart = (e: DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', String(id))
    e.dataTransfer.effectAllowed = 'move'
  }
  const draggedId = (e: DragEvent): number | null => {
    const id = Number(e.dataTransfer.getData('text/plain'))
    return Number.isFinite(id) && id !== 0 ? id : null
  }
  const allowDrop = (e: DragEvent, key: string) => {
    e.preventDefault()
    setOverKey(key)
  }
  const dropOnDay = (e: DragEvent, cellTs: number) => {
    e.preventDefault()
    setOverKey(null)
    const id = draggedId(e)
    if (id === null) return
    if (startOfDay(cellTs) < todayStart) {
      onNotice('别往昨天排 —— 过去的草救不回来 🥀')
      return
    }
    onPlan(id, cellTs)
  }
  const dropOnTray = (e: DragEvent) => {
    e.preventDefault()
    setOverKey(null)
    const id = draggedId(e)
    if (id === null) return
    onPlan(id, null)
  }

  const exportIcs = () => {
    const blob = new Blob([buildIcs(plants, now)], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = '待看花园.ics'
    a.click()
    URL.revokeObjectURL(a.href)
    onNotice('日历文件下好了 📆 导入系统日历，手机也会催你看视频')
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="cal">
      <div className="cal-head">
        <h2>{year} 年 {month + 1} 月</h2>
        <div className="cal-nav">
          <button onClick={exportIcs} title="下载 .ics 导入系统日历：排期和枯死预告都会出现在你手机日历里">ICS ↓</button>
          <button onClick={() => setOffset((o) => o - 1)} title="上个月">‹</button>
          {offset !== 0 && <button onClick={() => setOffset(0)}>回到本月</button>}
          <button onClick={() => setOffset((o) => o + 1)} title="下个月">›</button>
        </div>
      </div>

      <div
        className={'cal-tray' + (overKey === 'tray' ? ' over' : '')}
        onDragOver={(e) => allowDrop(e, 'tray')}
        onDragLeave={() => setOverKey(null)}
        onDrop={dropOnTray}
      >
        <span className="cal-tray-label">待排期</span>
        {unplanned.length === 0
          ? <span className="cal-tray-empty">都排好了 ✨（把日历里的 🌱 拖回这里可以取消排期）</span>
          : unplanned.map((p) => (
              <span
                key={p.id}
                className="cal-pill"
                draggable
                onDragStart={(e) => dragStart(e, p.id)}
                onClick={() => onOpen(p.id)}
                title={`${p.title} —— 点开详情；拖进下面的日历排档期`}
              >
                <i className={'sdot ' + dotClassOf(p, now)} /> {p.title}
              </span>
            ))}
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
          const isWeekend = i % 7 >= 5
          const all = items
            ? [
                ...items.planned.map((p) => ({ p, kind: 'planned' as const })),
                ...items.dying.map((p) => ({ p, kind: 'dying' as const })),
              ]
            : []
          const shown = all.slice(0, 3)
          const more = all.length - shown.length
          return (
            <div
              key={key}
              className={
                'cal-cell'
                + (isWeekend ? ' weekend' : '')
                + (isToday ? ' today' : '')
                + (isPast ? ' past' : '')
                + (overKey === key ? ' over' : '')
              }
              onDragOver={(e) => allowDrop(e, key)}
              onDragLeave={() => setOverKey(null)}
              onDrop={(e) => dropOnDay(e, cellTs)}
            >
              <span className="cal-day">{d}{isToday && <i>今天</i>}</span>
              {shown.map(({ p, kind }) => (
                <ItemLabel
                  key={kind[0] + p.id}
                  plant={p}
                  kind={kind}
                  onOpen={onOpen}
                  onDragStart={kind === 'planned' ? (e) => dragStart(e, p.id) : undefined}
                />
              ))}
              {more > 0 && <span className="cal-more">还有 {more} 条…</span>}
            </div>
          )
        })}
      </div>

      <div className="cal-legend">
        <span className="cal-key"><i className="k plan" />安排了看</span>
        <span className="cal-key"><i className="k die" />这天就枯死</span>
        <span className="cal-tip">拖草进格子排档期 · 拖回托盘取消 · 点任意一株看详情</span>
      </div>

      {bloomed.length > 0 && (
        <div className="cal-bloomed">
          <span className="cal-tray-label">已开花 {bloomed.length}</span>
          {bloomed.map((p) => (
            <span key={p.id} className="cal-pill bloom" onClick={() => onOpen(p.id)} title={`${p.title} —— 点开详情`}>
              <i className="sdot bloom" /> {p.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
