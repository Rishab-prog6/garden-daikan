import { useEffect, useRef, useState } from 'react'
import type { Plant } from '../types'
import { parseWatchData, matchSync } from '../lib/syncParse'
import type { SyncMatch } from '../lib/syncParse'

interface Props {
  plants: Plant[]
  onApply: (matches: SyncMatch[]) => void
  onNotice: (msg: string) => void
  onClose: () => void
}

interface Preview {
  matches: SyncMatch[]
  unmatched: number
  total: number
}

const PLACEHOLDER = `打开 B 站「历史记录」页 → Ctrl+A 全选 → Ctrl+C 复制 → 粘到这里
（或者 Ctrl+S 把页面存成 .html，点下面的按钮选文件）`

export function SyncModal({ plants, onApply, onNotice, onClose }: Props) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const recognize = (raw: string) => {
    const items = parseWatchData(raw)
    if (items.length === 0) {
      onNotice('没认出任何视频 —— 确认贴的是历史记录页吗？')
      return
    }
    setPreview({ ...matchSync(plants, items), total: items.length })
  }

  const onFile = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => recognize(String(reader.result))
    reader.readAsText(f)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">把 B 站的进度搬过来</h2>
        {preview === null ? (
          <>
            <p className="modal-hint">
              历史记录页自带每个视频的观看进度 —— 喂给花园，进度条自动就位，看完的直接开花。
              数据只在你浏览器里解析，不上传。
            </p>
            <textarea
              className="modal-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={7}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>选 .html 文件</button>
              <input
                ref={fileRef}
                type="file"
                accept=".html,.htm,.mhtml,.mht,text/html"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onFile(f)
                  e.target.value = ''
                }}
              />
              <button
                className="btn"
                onClick={() => {
                  if (!text.trim()) { onNotice('先贴点东西进来吧 🌱'); return }
                  recognize(text)
                }}
              >识别 🔍</button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-hint">
              认出 {preview.total} 个视频，
              {preview.matches.length > 0
                ? `其中 ${preview.matches.length} 株在你的花园里：`
                : '但都不在你的花园里 —— 先把它们种进来？'}
              {preview.unmatched > 0 && `（${preview.unmatched} 个不在花园，忽略）`}
            </p>
            {preview.matches.length > 0 && (
              <div className="sync-list">
                {preview.matches.map((m) => (
                  <div key={m.plantId} className="sync-row">
                    <span className="sync-icon"><i className={'sdot ' + (m.willBloom ? 'bloom' : 'grow')} /></span>
                    <span className="sync-title">{m.title}</span>
                    <b className={'sync-pct' + (m.willBloom ? ' bloom' : '')}>
                      {m.willBloom ? '看完，开花' : `${m.oldPct}% → ${m.newPct}%`}
                    </b>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setPreview(null)}>← 重新来</button>
              {preview.matches.length > 0 && (
                <button className="btn" onClick={() => { onApply(preview.matches); onClose() }}>
                  应用 ✨
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
