// 桌面通知封装（#2）。全部走特性检测 + try/catch，
// 不支持 / 被拒 / 隐私模式下都静默降级，绝不让花园崩。
// 纯客户端：只在浏览器开着、标签页还在时能弹通知；不碰后端、不碰登录态。

export type PermState = 'granted' | 'denied' | 'default' | 'unsupported'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): PermState {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission as PermState
}

/** 请求通知权限；不支持时返回 'unsupported'，出错时回退到当前权限 */
export async function requestNotificationPermission(): Promise<PermState> {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return (await Notification.requestPermission()) as PermState
  } catch {
    return notificationPermission()
  }
}

/** 发一条桌面通知。只有已授权才发；同 tag 会替换上一条，不堆叠 */
export function fireReminder(title: string, body: string): void {
  if (notificationPermission() !== 'granted') return
  try {
    new Notification(title, { body, tag: 'daikan-garden-wilt' })
  } catch {
    /* 部分浏览器要求 Service Worker 才能发通知，这里静默忽略 */
  }
}
