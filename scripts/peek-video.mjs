// 从录好的视频里抽几帧 png，人工核查内容用
import { chromium } from 'playwright'

const file = 'http://localhost:5173/demo/intro.webm'
const ats = process.argv.slice(2).map(Number)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.setContent(`<body style="margin:0;background:#000"><video id="v" src="${file}" width="1280" style="display:block"></video></body>`)
await page.waitForFunction(() => document.querySelector('#v').readyState >= 2)
const dur = await page.evaluate(() => document.querySelector('#v').duration)
console.log('duration:', Math.round(dur), 's')
for (const t of (ats.length ? ats : [3, Math.round(dur * 0.33), Math.round(dur * 0.66), Math.round(dur - 2)])) {
  await page.evaluate((tt) => { const v = document.querySelector('#v'); v.currentTime = tt }, t)
  await page.waitForFunction(() => document.querySelector('#v').seeking === false)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `demo/frame-${t}s.png` })
  console.log(`frame-${t}s.png`)
}
await browser.close()
