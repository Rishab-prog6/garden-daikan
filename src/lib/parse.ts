export interface ParsedItem {
  title: string
  link: string
  bvid?: string
}

const BV_RE = /BV[A-Za-z0-9]{10}/

function extractBvid(text: string): string | undefined {
  const m = text.match(BV_RE)
  return m ? m[0] : undefined
}

function cleanLink(url: string): string {
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    return url
  }
}

// 收藏夹页面整页复制时混进来的元数据行（时长、播放量、日期等）。
// 启发式判断，宁可放过不可错杀：标题被误删比混进一行杂质更伤。
const NOISE_PATTERNS: RegExp[] = [
  /^\d{1,2}:\d{2}(:\d{2})?$/, // 时长 03:24 / 1:02:33
  /^[\d.]+[万亿]?\s*(播放|观看|弹幕)(\s*[·•]\s*.*)?$/, // 3.2万播放 · 2023-5-1
  /^\d{4}[-/年]\s?\d{1,2}[-/月]\s?\d{1,2}日?$/, // 纯日期行
  /^(昨天|前天|今天|\d+\s*(小时|分钟|天|个月|年)前)$/, // 相对时间
  /^已失效视频$/,
  /^(收藏|投稿|发布)于.+$/,
  /^UP主?[:：]/i,
  /^\d+$/, // 纯数字（序号/计数）
]

function isNoiseLine(line: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(line))
}

export function parseImportText(raw: string): ParsedItem[] {
  const results: ParsedItem[] = []

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    // 跳过空行和纯标点行
    if (!trimmed || /^[\s\p{P}]+$/u.test(trimmed)) continue
    // 跳过收藏夹整页复制混进来的元数据行（时长/播放量/日期等）
    if (isNoiseLine(trimmed)) continue

    // App 分享格式：【标题】 链接
    const appShare = trimmed.match(/^【(.+?)】\s*(https?:\/\/\S+)/)
    if (appShare) {
      const title = appShare[1].replace(/-哔哩哔哩$/, '').trim()
      const rawLink = appShare[2]
      const bvid = extractBvid(rawLink)
      results.push({ title, link: bvid ? cleanLink(rawLink) : rawLink, bvid })
      continue
    }

    // 完整 bilibili 链接
    const biliLink = trimmed.match(/https?:\/\/(?:www\.)?bilibili\.com\/video\/(BV[A-Za-z0-9]{10})[^\s]*/i)
    if (biliLink) {
      const bvid = biliLink[1]
      results.push({ title: bvid, link: `https://www.bilibili.com/video/${bvid}`, bvid })
      continue
    }

    // 裸 BV 号
    if (/^BV[A-Za-z0-9]{10}$/.test(trimmed)) {
      results.push({ title: trimmed, link: `https://www.bilibili.com/video/${trimmed}`, bvid: trimmed })
      continue
    }

    // 其他非空行当纯标题
    results.push({ title: trimmed, link: '' })
  }

  return results
}
