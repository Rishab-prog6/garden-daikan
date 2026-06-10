// 花园报告分享卡（玩法参考 Spotify Wrapped）：Canvas 画一张竖版 PNG。
// 纯客户端生成，零依赖；色值运行时读 CSS 变量，跟主题保持一致。
import type { GardenState, Plant } from '../types'
import { SPRITE, statusOf, daysWaiting, level, currentStreak, isWilting } from './garden'

export interface GardenReport {
  total: number
  bloomed: number
  todo: number
  wilting: number
  oldest: { title: string; days: number } | null
  streak: number
  lv: number
  dateText: string
  /** 花园缩影：每株草一个 emoji，最多 21 个 */
  sprites: string[]
}

export function buildReport(state: GardenState, now: number): GardenReport {
  const plants = state.plants
  const todoPlants = plants.filter((p) => !p.watchedAt)
  const oldest = todoPlants.reduce<Plant | null>((a, p) => (!a || p.addedAt < a.addedAt ? p : a), null)
  const d = new Date(now)
  return {
    total: plants.length,
    bloomed: plants.length - todoPlants.length,
    todo: todoPlants.length,
    wilting: todoPlants.filter((p) => isWilting(p, now)).length,
    oldest: oldest ? { title: oldest.title, days: daysWaiting(oldest, now) } : null,
    streak: currentStreak(state.streak, now),
    lv: level(state.xp),
    dateText: `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`,
    sprites: plants.slice(0, 21).map((p) => SPRITE[statusOf(p, now)]),
  }
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1)
  return t + '…'
}

const CN = '"PingFang SC","Microsoft YaHei",sans-serif'

export function drawShareCard(canvas: HTMLCanvasElement, r: GardenReport) {
  const W = 750
  const H = 1000
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const paper = cssVar('--paper', '#EEF1E6')
  const paper2 = cssVar('--paper-2', '#E5EAD8')
  const card = cssVar('--card', '#F7F9F0')
  const ink = cssVar('--ink', '#2C3327')
  const inkSoft = cssVar('--ink-soft', '#5C6651')
  const leaf = cssVar('--leaf', '#6FA046')
  const leafDeep = cssVar('--leaf-deep', '#4E7A33')
  const bloom = cssVar('--bloom', '#FB7299')
  const wilt = cssVar('--wilt', '#CC9A3E')
  const line = cssVar('--line', '#CCD5BC')

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, paper)
  bg.addColorStop(1, paper2)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const sky = ctx.createRadialGradient(W / 2, -160, 60, W / 2, -160, 560)
  sky.addColorStop(0, cssVar('--sky', '#CFE0D2'))
  sky.addColorStop(1, 'rgba(207,224,210,0)')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, 420)

  // 标题区
  ctx.fillStyle = leafDeep
  ctx.font = `700 22px ${CN}`
  ctx.fillText('BUILD IN BILIBILI', 56, 78)
  ctx.fillStyle = ink
  ctx.font = `800 52px ${CN}`
  ctx.fillText('我的待看花园', 56, 140)
  ctx.fillStyle = inkSoft
  ctx.font = `400 24px ${CN}`
  ctx.textAlign = 'right'
  ctx.fillText(r.dateText, W - 56, 140)
  ctx.textAlign = 'left'

  // 四宫格统计
  const tiles: { num: number; label: string; color: string }[] = [
    { num: r.total, label: '一共种下', color: ink },
    { num: r.bloomed, label: '看完开花', color: bloom },
    { num: r.todo, label: '还在等我', color: leafDeep },
    { num: r.wilting, label: '正在枯萎', color: wilt },
  ]
  const tw = (W - 56 * 2 - 18 * 3) / 4
  tiles.forEach((t, i) => {
    const x = 56 + i * (tw + 18)
    ctx.fillStyle = card
    roundRect(ctx, x, 180, tw, 130, 18)
    ctx.fill()
    ctx.strokeStyle = line
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = t.color
    ctx.font = '700 46px Fredoka,system-ui,sans-serif'
    ctx.fillText(String(t.num), x + 20, 245)
    ctx.fillStyle = inkSoft
    ctx.font = `400 21px ${CN}`
    ctx.fillText(t.label, x + 20, 285)
  })

  // 开花率进度条
  const rate = r.total > 0 ? r.bloomed / r.total : 0
  ctx.fillStyle = inkSoft
  ctx.font = `400 24px ${CN}`
  ctx.fillText('开花率', 56, 380)
  ctx.fillStyle = ink
  ctx.font = '700 30px Fredoka,system-ui,sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.round(rate * 100)}%`, W - 56, 382)
  ctx.textAlign = 'left'
  ctx.fillStyle = paper2
  roundRect(ctx, 56, 398, W - 112, 18, 9)
  ctx.fill()
  if (rate > 0) {
    const grad = ctx.createLinearGradient(56, 0, W - 56, 0)
    grad.addColorStop(0, leaf)
    grad.addColorStop(1, bloom)
    ctx.fillStyle = grad
    roundRect(ctx, 56, 398, Math.max(18, (W - 112) * rate), 18, 9)
    ctx.fill()
  }

  // 拖延之王
  ctx.fillStyle = card
  roundRect(ctx, 56, 450, W - 112, 150, 18)
  ctx.fill()
  ctx.strokeStyle = line
  ctx.stroke()
  ctx.font = `700 24px ${CN}`
  ctx.fillStyle = wilt
  ctx.fillText('🥀 拖延之王', 84, 498)
  if (r.oldest) {
    ctx.fillStyle = ink
    ctx.font = `700 28px ${CN}`
    ctx.fillText(truncate(ctx, r.oldest.title, W - 112 - 56), 84, 540)
    ctx.fillStyle = inkSoft
    ctx.font = `400 23px ${CN}`
    ctx.fillText(`已经在收藏夹里躺了 ${r.oldest.days} 天`, 84, 576)
  } else {
    ctx.fillStyle = inkSoft
    ctx.font = `400 25px ${CN}`
    ctx.fillText('暂无 —— 全都看完了，这花园成精了', 84, 545)
  }

  // streak + LV
  const pillW = (W - 112 - 18) / 2
  ctx.fillStyle = card
  roundRect(ctx, 56, 630, pillW, 96, 18)
  ctx.fill()
  ctx.stroke()
  roundRect(ctx, 56 + pillW + 18, 630, pillW, 96, 18)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.font = `700 30px ${CN}`
  ctx.fillText(`${r.streak > 0 ? '🔥' : '🪵'} 连续浇水 ${r.streak} 天`, 86, 690)
  ctx.fillText(`🌿 园丁等级 LV ${r.lv}`, 86 + pillW + 18, 690)

  // 花园缩影（emoji 草地）
  ctx.fillStyle = card
  roundRect(ctx, 56, 756, W - 112, 150, 18)
  ctx.fill()
  ctx.stroke()
  if (r.sprites.length === 0) {
    ctx.fillStyle = inkSoft
    ctx.font = `400 24px ${CN}`
    ctx.fillText('花园还空着 —— 等我种点东西', 84, 840)
  } else {
    ctx.font = '34px system-ui'
    r.sprites.forEach((s, i) => {
      const col = i % 11
      const row = Math.floor(i / 11)
      ctx.fillText(s, 86 + col * 54, 818 + row * 52)
    })
  }

  // 底部
  ctx.fillStyle = inkSoft
  ctx.font = `400 22px ${CN}`
  ctx.fillText('🌱 待看花园 · 把收藏夹种成一片花园', 56, 956)
  ctx.textAlign = 'right'
  ctx.fillText('build in bilibili · AI 创造公开赛', W - 56, 956)
  ctx.textAlign = 'left'
}
