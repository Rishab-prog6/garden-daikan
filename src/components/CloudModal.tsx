import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { cloudReady } from '../lib/cloud'

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

interface Props {
  cloudKey: string | null
  status: SyncStatus
  lastSyncAt: number | null
  onEnable: () => void
  onRestore: (rawKey: string) => void
  onSyncNow: () => void
  onDisable: () => void
  onClose: () => void
}

const STATUS_TEXT: Record<SyncStatus, string> = {
  idle: '待同步',
  syncing: '同步中…',
  ok: '已同步',
  error: '同步失败 —— 稍后会再试',
}

export function CloudModal({ cloudKey, status, lastSyncAt, onEnable, onRestore, onSyncNow, onDisable, onClose }: Props) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (cloudKey && qrRef.current) {
      QRCode.toCanvas(qrRef.current, cloudKey, {
        width: 168,
        margin: 1,
        color: { dark: '#0A0C0B', light: '#E6EDE7' },
      }).catch(() => { /* 二维码画不出不影响功能 */ })
    }
  }, [cloudKey])

  const copy = async () => {
    if (!cloudKey) return
    try {
      await navigator.clipboard.writeText(cloudKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch { /* 剪贴板被拒就手动选 */ }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">花园钥匙 · 云同步</h2>
        {!cloudReady() ? (
          <>
            <p className="modal-hint">云同步后端还没部署（见 cloud/README.md）。部署好把地址填进 cloud.ts 就能用。</p>
            <div className="modal-actions"><button className="btn btn-ghost" onClick={onClose}>关闭</button></div>
          </>
        ) : cloudKey === null ? (
          <>
            <p className="modal-hint">
              生成一把只属于你的钥匙，花园在你的浏览器里<b>加密后</b>才上云 ——
              服务器只见乱码，没有账号、不收任何个人信息。换设备输钥匙即恢复。
              <b>钥匙丢了谁也解不开（包括我们），生成后务必抄好。</b>
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={onEnable}>生成我的钥匙</button>
            </div>
            <p className="modal-hint cloud-divider">已经有钥匙？在别的设备开过云同步的话：</p>
            <input
              className="plan-input"
              placeholder="garden-xxxx-xxxx-…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && input.trim() && onRestore(input)}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>关闭</button>
              <button className="btn" onClick={() => input.trim() && onRestore(input)}>恢复花园</button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-hint">这就是你的钥匙 —— 抄下来或截图存好，换设备靠它认领花园：</p>
            <button className="cloud-key" onClick={copy} title="点击复制">
              {cloudKey}
              <span className="cloud-copy">{copied ? '已复制 ✓' : '点击复制'}</span>
            </button>
            <div className="cloud-qr-wrap"><canvas ref={qrRef} className="cloud-qr" /></div>
            <p className="modal-hint">
              状态：{STATUS_TEXT[status]}
              {lastSyncAt ? ` · 上次同步 ${new Date(lastSyncAt).toLocaleTimeString()}` : ''}
              　·　改动会自动上云
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost danger" onClick={onDisable} title="只删除本机钥匙；云端密文保留，凭钥匙随时回来">
                本机退出同步
              </button>
              <button className="btn btn-ghost" onClick={onClose}>关闭</button>
              <button className="btn" onClick={onSyncNow}>立即同步</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
