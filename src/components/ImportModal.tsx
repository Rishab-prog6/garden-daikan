import { useEffect, useRef, useState } from 'react'
import { parseImportText } from '../lib/parse'
import type { ParsedItem } from '../lib/parse'

interface Props {
  onImport: (items: ParsedItem[]) => void
  onClose: () => void
}

const PLACEHOLDER = `https://www.bilibili.com/video/BV1xx411c7mD
BV1GJ411x7h7
【好看的纪录片-哔哩哔哩】 https://b23.tv/xxxxxx
自己手打的标题也行`

export function ImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleImport = () => {
    if (!text.trim()) {
      onImport([]) // 触发空输入提示
      return
    }
    const items = parseImportText(text)
    onImport(items)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">把待看的视频种进来</h2>
        <p className="modal-hint">支持 B 站链接、BV 号、App 分享文本，一行一个</p>
        <textarea
          ref={textareaRef}
          className="modal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
        />
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn" onClick={handleImport}>种下 🌱</button>
        </div>
      </div>
    </div>
  )
}
