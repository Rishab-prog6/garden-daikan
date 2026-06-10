// 把排期和枯死预告导出成 .ics（iCalendar），用户导入系统日历后，
// 手机/电脑日历会替花园提醒：哪天该看什么、哪株哪天就枯了。
// 纯文本生成，零依赖；全天事件，不需要时区数据库。
import type { Plant } from '../types'
import { critAt, startOfDay, DAY } from './garden'

/** RFC 5545 文本转义 */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDate(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function event(uid: string, dateTs: number, summary: string, description: string, dtstamp: string): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@daikan-garden`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${icsDate(dateTs)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
    'END:VEVENT',
  ]
}

export function buildIcs(plants: Plant[], now: number): string {
  const d = new Date()
  const dtstamp =
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}` +
    `T${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//daikan-garden//build in bilibili//CN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:待看花园',
  ]

  const todayStart = startOfDay(now)
  for (const p of plants) {
    if (p.watchedAt) continue
    const link = p.link ? `\n${p.link}` : ''
    if (p.plannedFor) {
      lines.push(...event(`plant-${p.id}-plan`, p.plannedFor, `🌱 看「${p.title}」`, `待看花园的排期${link}`, dtstamp))
    }
    const crit = critAt(p)
    // 过去的枯死日就不打扰了，只提醒今天起 30 天内的
    if (startOfDay(crit) >= todayStart && crit - now < 30 * DAY) {
      lines.push(...event(`plant-${p.id}-wilt`, crit, `🥀 「${p.title}」今天就枯了，快去看`, `再不看，这株草就没了 —— 待看花园${link}`, dtstamp))
    }
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
