import { useEffect, useRef } from 'react'
import type { GardenState } from '../types'
import { buildReport, drawShareCard } from '../lib/sharecard'

interface Props {
  state: GardenState
  now: number
  onClose: () => void
}

export function ShareModal({ state, now, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) drawShareCard(canvasRef.current, buildReport(state, now))
  }, [state, now])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = '我的待看花园.png'
    a.click()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal share">
        <h2 className="modal-title">晒晒我的花园</h2>
        <p className="modal-hint">存下来发动态/朋友圈，让大家看看你收藏夹的惨状 🥀</p>
        <canvas ref={canvasRef} className="share-canvas" />
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
          <button className="btn" onClick={download}>保存图片 📸</button>
        </div>
      </div>
    </div>
  )
}
