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

export function parseImportText(raw: string): ParsedItem[] {
  const results: ParsedItem[] = []

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    // 跳过空行和纯标点行
    if (!trimmed || /^[\s\p{P}]+$/u.test(trimmed)) continue

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
