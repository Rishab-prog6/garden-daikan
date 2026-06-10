import { useEffect, useState } from 'react'
import type { Plant, Status } from '../types'
import { SPRITE, statusOf, daysWaiting, daysOverdue, fmtDay } from '../lib/garden'

const STATUS_TEXT: Record<Status, string> = {
  fresh: '🌱 新鲜',
  wilt: '🥀 在枯萎',
  crit: '🥀 快枯了',
  bloom: '🌸 已开花',
}

interface Props {
  plant: Plant
  now: number
  onClose: () => void
  onFinish: (id: number) => void
  onRemove: (id: number) => void
  onPlan: (id: number, ts: number | null) => void
  /** 拖进度条；拖到 100 由 App 转成开花 */
  onProgress: (id: number, pct: number) => void
  /** 点「去B站看」出门时打戳，回来好问"看完了吗" */
  onVisited: (id: number) => void
}

function toInputValue(t: number): string {
  const d = new Date(t)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function PlantDetailModal({ plant, now, onClose, onFinish, onRemove, onPlan, onProgress, onVisited }: Props) {
  const st = statusOf(plant, now)
  const [picking, setPicking] = useState(false)
  const d = daysWaiting(plant, now)
  const late = daysOverdue(plant, now)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pick = (value: string) => {
    if (!value) {
      onPlan(plant.id, null)
    } else {
      const [y, m, day] = value.split('-').map(Number)
      // 取中午，避免时区边界把日期挪一天
      onPlan(plant.id, new Date(y, m - 1, day, 12).getTime())
    }
    setPicking(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal detail">
        <span className="detail-sprite">{SPRITE[st]}</span>
        <h2 className="modal-title">{plant.title}</h2>
        <div className="detail-rows">
          <div className="detail-row">
            <span>状态</span>
            <b>{STATUS_TEXT[st]}{!plant.watchedAt && d > 0 ? `（等了 ${d} 天）` : ''}</b>
          </div>
          <div className="detail-row"><span>种下</span><b>{fmtDay(plant.addedAt)}</b></div>
          {plant.watchedAt
            ? <div className="detail-row"><span>开花</span><b>🌸 {fmtDay(plant.watchedAt)}</b></div>
            : (
              <div className="detail-row">
                <span>档期</span>
                <b className={late > 0 ? 'late-text' : ''}>
                  {plant.plannedFor
                    ? `📅 ${fmtDay(plant.plannedFor)}${late > 0 ? `（爽约 ${late} 天）` : ''}`
                    : '还没排 —— 拖进日历或点下面排期'}
                </b>
              </div>
            )}
          {plant.bvid && <div className="detail-row"><span>BV 号</span><b>{plant.bvid}</b></div>}
        </div>
        {!plant.watchedAt && (
          <div className="detail-progress">
            <div className="detail-progress-head">
              <span>看到哪儿了？拖到头直接开花</span>
              <b>{plant.progress ?? 0}%</b>
            </div>
            <input
              className="progress-range"
              type="range"
              min={0}
              max={100}
              step={5}
              value={plant.progress ?? 0}
              onChange={(e) => onProgress(plant.id, Number(e.target.value))}
            />
          </div>
        )}
        {picking && (
          <input
            className="plan-input"
            type="date"
            autoFocus
            defaultValue={plant.plannedFor ? toInputValue(plant.plannedFor) : ''}
            onChange={(e) => pick(e.target.value)}
          />
        )}
        <div className="detail-actions">
          {plant.link && (
            <a
              className="btn btn-ghost"
              href={plant.link}
              target="_blank"
              rel="noreferrer"
              onClick={() => onVisited(plant.id)}
            >去 B 站看 ↗</a>
          )}
          {!plant.watchedAt && (
            <button className="btn btn-ghost" onClick={() => setPicking((v) => !v)}>
              📅 {plant.plannedFor ? '改期' : '排期'}
            </button>
          )}
          {!plant.watchedAt && plant.plannedFor && (
            <button className="btn btn-ghost" onClick={() => onPlan(plant.id, null)}>取消档期</button>
          )}
          <button className="btn btn-ghost danger" onClick={() => { onRemove(plant.id); onClose() }}>移出花园</button>
          {!plant.watchedAt && (
            <button className="btn" onClick={() => { onFinish(plant.id); onClose() }}>看完了 🌸</button>
          )}
        </div>
      </div>
    </div>
  )
}
