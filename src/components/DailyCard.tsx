import type { Plant } from '../types'
import { spriteOf } from '../lib/garden'
import { notificationPermission } from '../lib/reminders'

interface Props {
  /** 今日最该救的草（已按危险程度排好） */
  picks: Plant[]
  /** 还有几株没看 */
  todoCount: number
  /** 其中几株命悬一线 */
  crit: number
  /** 当前有效连续天数 */
  streak: number
  /** 今天浇过水没（看完过至少一个） */
  wateredToday: boolean
  now: number
  remindersEnabled: boolean
  onToggleReminders: (on: boolean) => void
  onOpen: (id: number) => void
}

export function DailyCard({
  picks, todoCount, crit, streak, wateredToday, now, remindersEnabled, onToggleReminders, onOpen,
}: Props) {
  const perm = notificationPermission()
  const bellOn = remindersEnabled && perm === 'granted'
  const denied = remindersEnabled && perm === 'denied'

  const streakLabel = wateredToday
    ? '连续浇水 · 今天已浇 ✓'
    : streak > 0
      ? '天 —— 今天还没浇，别让火灭了'
      : '今天看完一个，点燃火苗'

  return (
    <div className="daily">
      <div className="daily-streak" title="每天看完至少一个视频，火苗就不灭（断一天就重新烧）">
        <span className="flame">{streak > 0 ? '🔥' : '🪵'}</span>
        <b>{streak}</b>
        <span className="daily-streak-label">{streakLabel}</span>
      </div>

      <div className="daily-list">
        <span className="daily-title">
          今日浇水清单{crit > 0 && <em> · {crit} 株命悬一线</em>}
        </span>
        {todoCount === 0
          ? <span className="daily-empty">花园全开花了 ✨ 种点新的进来吧</span>
          : picks.map((p) => (
              <button key={p.id} className="daily-pick" onClick={() => onOpen(p.id)} title={`${p.title} —— 点开详情`}>
                {spriteOf(p, now)} {p.title}
              </button>
            ))}
      </div>

      {perm !== 'unsupported' && (
        <button
          className={'reminder-bell' + (bellOn ? ' on' : '')}
          onClick={() => onToggleReminders(!remindersEnabled)}
        >
          {bellOn ? '🔔 提醒已开' : '🔔 开启提醒'}
        </button>
      )}
      {denied && (
        <p className="reminder-hint">浏览器把通知权限拦掉了 —— 点地址栏左边的图标，把通知改成「允许」就能收到啦。</p>
      )}
    </div>
  )
}
