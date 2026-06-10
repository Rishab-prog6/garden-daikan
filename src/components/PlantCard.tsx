import { useState } from 'react'
import type { Plant } from '../types'
import { SPRITE, statusOf, daysWaiting, daysOverdue, fmtDay } from '../lib/garden'

const DOTCOL: Record<string, string> = {
  fresh: 'var(--leaf)', wilt: 'var(--wilt)', crit: 'var(--dead)', bloom: 'var(--bloom)',
}

function Title({ plant }: { plant: Plant }) {
  // 有链接就让标题可点，新标签页打开去看；没链接保持纯文本
  if (!plant.link) return <div className="ptitle">{plant.title}</div>
  return (
    <div className="ptitle">
      <a href={plant.link} target="_blank" rel="noreferrer" title="去 B 站看这个视频">{plant.title}</a>
    </div>
  )
}

function toInputValue(t: number): string {
  const d = new Date(t)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function PlantCard({
  plant, now, onFinish, onRemove, onPlan,
}: {
  plant: Plant
  now: number
  onFinish: (id: number) => void
  onRemove: (id: number) => void
  onPlan: (id: number, ts: number | null) => void
}) {
  const st = statusOf(plant, now)
  const [picking, setPicking] = useState(false)

  if (plant.watchedAt) {
    return (
      <div className="plant bloom">
        <span className="bloomtag">DONE</span>
        <span className="sprite">🌸</span>
        <Title plant={plant} />
        <div className="pmeta">
          <span className="dot" style={{ background: DOTCOL.bloom }} />已开花
        </div>
        <div className="pact">
          <button className="mini del" title="移出花园" onClick={() => onRemove(plant.id)}>✕</button>
        </div>
      </div>
    )
  }

  const d = daysWaiting(plant, now)
  const waitTxt = d <= 0 ? '今天种下' : `等了 ${d} 天`
  const late = daysOverdue(plant, now)

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
    <div className={'plant ' + (st === 'fresh' ? '' : 'wilt')}>
      {st === 'crit' && <span className="badge crit">快枯了</span>}
      {st === 'wilt' && <span className="badge">在枯萎</span>}
      <span className="sprite">{SPRITE[st]}</span>
      <Title plant={plant} />
      <div className="pmeta">
        <span className="dot" style={{ background: DOTCOL[st] }} />{waitTxt}
      </div>
      {plant.plannedFor && (
        <button className={'plan-chip' + (late > 0 ? ' late' : '')} onClick={() => setPicking((v) => !v)}>
          📅 {fmtDay(plant.plannedFor)}{late > 0 ? ` · 爽约 ${late} 天` : ' 看'}
        </button>
      )}
      {picking && (
        <input
          className="plan-input"
          type="date"
          autoFocus
          defaultValue={plant.plannedFor ? toInputValue(plant.plannedFor) : ''}
          onChange={(e) => pick(e.target.value)}
          onBlur={() => setPicking(false)}
        />
      )}
      <div className="pact">
        <button className="mini done" onClick={() => onFinish(plant.id)}>看完了</button>
        <button className="mini cal" title="排个档期：打算哪天看？" onClick={() => setPicking((v) => !v)}>📅</button>
        <button className="mini del" title="移出花园" onClick={() => onRemove(plant.id)}>✕</button>
      </div>
    </div>
  )
}
