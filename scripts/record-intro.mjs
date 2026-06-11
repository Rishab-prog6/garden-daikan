// 自动录制功能巡演视频：Playwright 驱动 localhost:5173，浏览器会话直接出 .webm。
// 用法：node scripts/record-intro.mjs（需 dev server 在跑，或脚本自己拉起）
// 输出：demo/intro.webm
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, renameSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const APP = 'http://localhost:5173'
const W = 1280
const H = 800

async function serverUp() {
  try { const r = await fetch(APP); return r.ok } catch { return false }
}

async function ensureServer() {
  if (await serverUp()) return null
  console.log('dev server 没在跑，拉一个…')
  const child = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), shell: true, stdio: 'ignore', detached: false })
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await serverUp()) return child
  }
  throw new Error('dev server 起不来')
}

// 演示用的花园状态：状态分布讲故事用
function demoState() {
  const DAY = 86400000
  const now = Date.now()
  const d = new Date(now - DAY)
  const yesterday = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  return {
    plants: [
      { id: 1, title: '《三体》动画解说合集（共 8 集）', link: 'https://www.bilibili.com/video/BV1xx411c7mD', bvid: 'BV1xx411c7mD', addedAt: now - 8 * DAY, watchedAt: null },
      { id: 2, title: '30 分钟搞懂 Transformer 注意力机制', link: '', addedAt: now - 4 * DAY, watchedAt: null },
      { id: 3, title: '深夜食堂复刻：一个人也要好好吃饭', link: '', addedAt: now - 2 * DAY, watchedAt: null, progress: 40 },
      { id: 4, title: '从零开始学 Blender 建模', link: '', addedAt: now - 1 * DAY, watchedAt: null },
      { id: 5, title: '宿舍党也能做的 5 道快手菜', link: '', addedAt: now - 3 * DAY, watchedAt: now - DAY },
    ],
    xp: 35,
    demoOffset: 0,
    reminders: { enabled: false, lastNotifiedOn: null },
    streak: { count: 2, lastDoneOn: yesterday },
  }
}

// 注入一个发光假光标，跟着鼠标走，点击时有涟漪 —— 录像里才看得见操作
const FAKE_CURSOR = `
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div')
    c.id = 'fake-cursor'
    c.style.cssText = 'position:fixed;left:0;top:0;width:18px;height:18px;border-radius:50%;' +
      'background:rgba(61,240,140,.35);border:2px solid #3DF08C;box-shadow:0 0 14px rgba(61,240,140,.8);' +
      'pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:left .04s linear,top .04s linear;'
    document.body.appendChild(c)
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
    addEventListener('mousedown', () => { c.style.background = 'rgba(255,92,138,.6)'; c.style.borderColor = '#FF5C8A' }, true)
    addEventListener('mouseup', () => { c.style.background = 'rgba(61,240,140,.35)'; c.style.borderColor = '#3DF08C' }, true)
  })
`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const server = await ensureServer()
  mkdirSync('demo', { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: 'demo', size: { width: W, height: H } },
  })
  const page = await ctx.newPage()
  const state = demoState()
  await page.addInitScript((s) => localStorage.setItem('daikan-garden:state', s), JSON.stringify(state))
  await page.addInitScript(FAKE_CURSOR)

  /** 平滑移动到元素中心并返回坐标 */
  async function glideTo(selector, opts = {}) {
    const el = page.locator(selector).first()
    await el.waitFor({ state: 'visible', timeout: 5000 })
    if (opts.scroll !== false) { await el.scrollIntoViewIfNeeded(); await sleep(300) }
    const box = await el.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y, { steps: 22 })
    return { x, y }
  }
  async function clickEl(selector) {
    await glideTo(selector)
    await sleep(250)
    await page.mouse.down(); await sleep(90); await page.mouse.up()
  }
  /** HTML5 拖拽：托盘第一颗药丸 → 日历某天。事件派发触发逻辑，鼠标轨迹负责画面 */
  async function dragPillToDay(day) {
    const pts = await page.evaluate((d) => {
      const pill = document.querySelector('.cal-pill:not(.bloom)')
      const cell = [...document.querySelectorAll('.cal-grid .cal-cell:not(.pad)')][d - 1]
      cell.scrollIntoView({ block: 'center' })
      const pb = pill.getBoundingClientRect()
      const cb = cell.getBoundingClientRect()
      window.__dragEls = { pill, cell }
      return { fx: pb.x + pb.width / 2, fy: pb.y + pb.height / 2, tx: cb.x + cb.width / 2, ty: cb.y + cb.height / 2 }
    }, day)
    await page.mouse.move(pts.fx, pts.fy, { steps: 18 })
    await sleep(280)
    await page.evaluate(() => {
      const { pill, cell } = window.__dragEls
      const dt = new DataTransfer()
      window.__dt = dt
      pill.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
      cell.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
    })
    await page.mouse.move(pts.tx, pts.ty, { steps: 26 })
    await sleep(480)
    await page.evaluate(() => {
      const { cell } = window.__dragEls
      cell.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: window.__dt }))
    })
  }

  // ============ 剧本开始 ============
  await page.goto(APP)
  await sleep(2600) // ① 开场:夜光花园全貌

  // ② 今日浇水清单:点开最危险那株的详情(红色呼吸灯)
  await clickEl('.daily-pick')
  await sleep(2200)
  await page.keyboard.press('Escape')
  await sleep(700)

  // ③ 手动种一株
  await clickEl('.add input')
  await page.keyboard.type('今晚就看：给花园录个 intro', { delay: 55 })
  await sleep(400)
  await clickEl('.add .btn:not(.btn-import)')
  await sleep(1400)

  // ④ 批量导入:混合格式 + 杂质行,唰一下变成草
  await clickEl('.btn-import >> nth=0')
  await sleep(600)
  await page.evaluate(() => {
    const ta = document.querySelector('.modal-textarea')
    const v = [
      'https://www.bilibili.com/video/BV1GJ411x7h7?spm_id_from=333',
      '【硬核】CPU是怎么造出来的？',
      '3.2万播放 · 2023-05-01',
      '04:13',
      'BV1U1Lv6pEBN',
      '在沙漠里种了1800万棵树，然后呢？',
    ].join('\n')
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    set.call(ta, v)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await sleep(1500)
  await clickEl('.modal-actions .btn:not(.btn-ghost)')
  await sleep(1800)

  // ⑤ 拖拽排期:托盘 → 后天;再试拖到昨天(被怼)
  const today = new Date().getDate()
  await dragPillToDay(Math.min(today + 2, 28))
  await sleep(1600)
  if (today > 1) {
    await dragPillToDay(today - 1)
    await sleep(1800) // toast:过去的草救不回来
  }

  // ⑥ 详情进度条:看了一半的草,拖到 70%
  await page.evaluate(() => {
    const pill = [...document.querySelectorAll('.cal-pill:not(.bloom)')].find((p) => p.textContent.includes('深夜食堂'))
    if (pill) pill.scrollIntoView({ block: 'center' })
  })
  await sleep(400)
  const pillSel = '.cal-pill:not(.bloom)'
  await page.evaluate(() => {
    const pill = [...document.querySelectorAll('.cal-pill:not(.bloom)')].find((p) => p.textContent.includes('深夜食堂'))
    if (pill) pill.click()
  })
  await glideTo('.modal.detail')
  await sleep(1200)
  await glideTo('.progress-range')
  await page.evaluate(() => {
    const r = document.querySelector('.progress-range')
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    for (const v of [50, 60, 70]) {
      set.call(r, String(v))
      r.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await sleep(1400)
  await page.keyboard.press('Escape')
  await sleep(700)

  // ⑦ 看完一株快枯的 → 起死回生 + streak 续火
  await page.evaluate(() => {
    const pill = [...document.querySelectorAll('.cal-pill:not(.bloom), .daily-pick')].find((p) => p.textContent.includes('三体'))
    if (pill) pill.click()
  })
  await sleep(1100)
  await clickEl('.detail-actions .btn:not(.btn-ghost)')
  await sleep(2200) // toast:起死回生 +25 XP · 连续浇水 3 天

  // ⑧ 同步进度:把历史记录粘进来,自动识别
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(600)
  await clickEl('.add button[title*="同步"]')
  await sleep(700)
  await page.evaluate(() => {
    const ta = document.querySelector('.modal-textarea')
    const v = [
      '30 分钟搞懂 Transformer 注意力机制',
      '已看完',
      '30 分钟搞懂 Transformer 注意力机制',
      '某 UP 主',
      '06-10 21:00',
      '从零开始学 Blender 建模',
      '12:00/40:00',
      '从零开始学 Blender 建模',
      '某 UP 主',
      '06-10 20:00',
    ].join('\n')
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    set.call(ta, v)
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await sleep(1300)
  await clickEl('.modal-actions .btn:not(.btn-ghost)') // 识别
  await sleep(2000) // 预览列表停留
  await clickEl('.modal-actions .btn:not(.btn-ghost)') // 应用
  await sleep(2000)

  // ⑨ 快进 3 天:草当场枯给你看
  await page.evaluate(() => document.querySelector('.foot').scrollIntoView({ block: 'center' }))
  await sleep(500)
  await clickEl('.demo button:nth-of-type(1)')
  await sleep(900)
  await clickEl('.demo button:nth-of-type(1)')
  await sleep(700)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(2200) // 看信号灯变色

  // ⑩ 晒花园:报告卡收尾
  await clickEl('.share-btn')
  await sleep(3200)
  await page.keyboard.press('Escape')
  await sleep(500)
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }))
  await sleep(1800)

  // ============ 收工 ============
  await ctx.close()
  await browser.close()
  const f = readdirSync('demo').find((x) => x.endsWith('.webm') && !x.startsWith('intro'))
  if (f) renameSync(join('demo', f), join('demo', 'intro.webm'))
  console.log('录好了：demo/intro.webm')
  if (server) server.kill()
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
