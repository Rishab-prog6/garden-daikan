import type { Plant } from '../types'
import { SPRITE, statusOf, daysWaiting } from '../lib/garden'

const DOTCOL: Record<string, string> = {
  fresh: 'var(--leaf)', wilt: 'var(--wilt)', crit: 'var(--dead)', bloom: 'var(--bloom)',
}

export function PlantCard({
  plant, now, onFinish, onRemove,
}: {
  plant: Plant
  now: number
  onFinish: (id: number) => void
  onRemove: (id: number) => void
}) {
  const st = statusOf(plant, now)

  if (plant.watchedAt) {
    return (
      <div className="plant bloom">
        <span className="bloomtag">DONE</span>
        <span className="sprite">🌸</span>
        <div className="ptitle">{plant.title}</div>
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
  return (
    <div className={'plant ' + (st === 'fresh' ? '' : 'wilt')}>
      {st === 'crit' && <span className="badge crit">快枯了</span>}
      {st === 'wilt' && <span className="badge">在枯萎</span>}
      <span className="sprite">{SPRITE[st]}</span>
      <div className="ptitle">{plant.title}</div>
      <div className="pmeta">
        <span className="dot" style={{ background: DOTCOL[st] }} />{waitTxt}
      </div>
      <div className="pact">
        <button className="mini done" onClick={() => onFinish(plant.id)}>看完了</button>
        <button className="mini del" title="移出花园" onClick={() => onRemove(plant.id)}>✕</button>
      </div>
    </div>
  )
}
