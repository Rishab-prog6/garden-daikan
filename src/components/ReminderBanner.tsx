import { wiltSummary } from '../lib/garden'
import { notificationPermission } from '../lib/reminders'

interface Props {
  wilt: number
  crit: number
  remindersEnabled: boolean
  onToggleReminders: (on: boolean) => void
  onSeeWilting: () => void
}

export function ReminderBanner({ wilt, crit, remindersEnabled, onToggleReminders, onSeeWilting }: Props) {
  // 没有草在枯就不打扰
  if (wilt + crit === 0) return null

  const perm = notificationPermission()
  const on = remindersEnabled && perm === 'granted'
  const denied = remindersEnabled && perm === 'denied'

  return (
    <div className="reminder">
      <div className="reminder-text">
        <span className="reminder-emoji">🥀</span>
        <span>{wiltSummary(wilt, crit)} —— 今天救几株?</span>
      </div>
      <div className="reminder-actions">
        <button className="reminder-see" onClick={onSeeWilting}>看看是哪些</button>
        {perm !== 'unsupported' && (
          <button
            className={'reminder-bell' + (on ? ' on' : '')}
            onClick={() => onToggleReminders(!remindersEnabled)}
          >
            {on ? '🔔 提醒已开' : '🔔 开启提醒'}
          </button>
        )}
      </div>
      {denied && (
        <p className="reminder-hint">浏览器把通知权限拦掉了 —— 点地址栏左边的图标，把通知改成「允许」就能收到啦。</p>
      )}
    </div>
  )
}
