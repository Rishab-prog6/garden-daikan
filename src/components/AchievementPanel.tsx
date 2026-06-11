import type { Achievement } from '../lib/achievements'

interface Props {
  achievements: Achievement[]
}

export function AchievementPanel({ achievements }: Props) {
  const done = achievements.filter((a) => a.done).length
  return (
    <section className="achievements" aria-label="成就系统">
      <div className="section-head">
        <div>
          <span className="eyebrow">ACHIEVEMENTS</span>
          <h2>花园成就</h2>
        </div>
        <span className="section-count">{done}/{achievements.length}</span>
      </div>
      <div className="achievement-grid">
        {achievements.map((a) => (
          <article className={'achievement' + (a.done ? ' done' : '')} key={a.id}>
            <div className="achievement-top">
              <span className="achievement-mark">{a.done ? '✓' : '○'}</span>
              <b>{a.title}</b>
              <em>{a.progress}</em>
            </div>
            <p>{a.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
