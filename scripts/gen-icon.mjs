// 生成 PWA 图标：夜光底 + 发光的「园」字 + 信号点，512/192 两档
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const browser = await chromium.launch()
const page = await browser.newPage()

for (const size of [512, 192]) {
  const dataUrl = await page.evaluate((S) => {
    const c = document.createElement('canvas')
    c.width = S
    c.height = S
    const ctx = c.getContext('2d')
    // 夜光底（maskable 全出血,安全区中心 80%）
    ctx.fillStyle = '#0A0C0B'
    ctx.fillRect(0, 0, S, S)
    const glow = ctx.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S * 0.62)
    glow.addColorStop(0, 'rgba(61,240,140,.28)')
    glow.addColorStop(1, 'rgba(61,240,140,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, S, S)
    // 发光的「园」
    ctx.fillStyle = '#3DF08C'
    ctx.shadowColor = 'rgba(61,240,140,.9)'
    ctx.shadowBlur = S * 0.09
    ctx.font = `700 ${Math.round(S * 0.52)}px "Microsoft YaHei","PingFang SC",sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('园', S / 2, S * 0.52)
    // 右上角一颗开花粉信号点
    ctx.shadowColor = 'rgba(255,92,138,.9)'
    ctx.shadowBlur = S * 0.06
    ctx.fillStyle = '#FF5C8A'
    ctx.beginPath()
    ctx.arc(S * 0.78, S * 0.22, S * 0.045, 0, Math.PI * 2)
    ctx.fill()
    return c.toDataURL('image/png')
  }, size)
  mkdirSync('public', { recursive: true })
  writeFileSync(`public/icon-${size}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'))
  console.log(`public/icon-${size}.png`)
}
await browser.close()
