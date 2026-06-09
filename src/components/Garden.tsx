import type { Plant, Status } from '../types'
import { statusOf } from '../lib/garden'
import { PlantCard } from './PlantCard'

export type Filter = 'todo' | 'bloom' | 'all'

const ORDER: Record<Status, number> = { crit: 0, wilt: 1, fresh: 2, bloom: 3 }

export function Garden({
  plants, now, filter, onFilter, onFinish, onRemove,
}: {
  plants: Plant[]
  now: number
  filter: Filter
  onFilter: (f: Filter) => void
  onFinish: (id: number) => void
  onRemove: (id: number) => void
}) {
  const todo = plants.filter((p) => !p.watchedAt)
  const bloomed = plants.filter((p) => p.watchedAt)

  const list = (filter === 'todo' ? todo : filter === 'bloom' ? bloomed : plants)
    .slice()
    .sort((a, b) => {
      if (filter === 'bloom') return (b.watchedAt ?? 0) - (a.watchedAt ?? 0)
      // 最危险的排最前，催你先看它
      return ORDER[statusOf(a, now)] - ORDER[statusOf(b, now)] || b.addedAt - a.addedAt
    })

  return (
    <>
      <div className="gardenhead">
        <h2>我的花园</h2>
        <div className="filters">
          <button className="chip" aria-pressed={filter === 'todo'} onClick={() => onFilter('todo')}>待看 {todo.length}</button>
          <button className="chip" aria-pressed={filter === 'bloom'} onClick={() => onFilter('bloom')}>开花 {bloomed.length}</button>
          <button className="chip" aria-pressed={filter === 'all'} onClick={() => onFilter('all')}>全部</button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="big">{filter === 'bloom' ? '🌼' : '🪴'}</div>
          <p>
            {filter === 'bloom'
              ? '还没有开花的视频。看完一个,这里就会开出第一朵花。'
              : '花园还空着。把想看的 B 站视频种进来 —— 看完它就开花,拖着不看它会枯萎。'}
          </p>
        </div>
      ) : (
        <div className="grid">
          {list.map((p) => (
            <PlantCard key={p.id} plant={p} now={now} onFinish={onFinish} onRemove={onRemove} />
          ))}
        </div>
      )}
    </>
  )
}
