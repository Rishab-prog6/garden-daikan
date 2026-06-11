import { useRef } from 'react'

interface Props {
  onFastForward: () => void
  onReset: () => void
  onExportBackup: () => void
  onImportBackup: (file: File) => void
  /** URL 带 ?demo=1 才显示快进/重置（录屏调试入口，公开版隐藏） */
  demoMode: boolean
}

export function Footer({ onFastForward, onReset, onExportBackup, onImportBackup, demoMode }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="foot">
      <span className="ver">v0.1 · 数据已存在本机浏览器</span>
      <div className="demo">
        <span>数据：</span>
        <button onClick={onExportBackup}>导出备份</button>
        <button onClick={() => fileRef.current?.click()}>导入备份</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImportBackup(f)
            e.target.value = '' // 同一个文件可以再次选择
          }}
        />
        {demoMode && (
          <>
            <span>演示模式：</span>
            <button onClick={onFastForward}>⏩ 快进 3 天</button>
            <button onClick={onReset}>重置</button>
          </>
        )}
      </div>
    </div>
  )
}
