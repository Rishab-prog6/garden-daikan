import { useState } from 'react'

interface Props {
  onAdd: (title: string) => void
  onOpenImport: () => void
  onOpenSync: () => void
}

export function AddPlant({ onAdd, onOpenImport, onOpenSync }: Props) {
  const [v, setV] = useState('')
  const submit = () => {
    onAdd(v)
    setV('')
  }
  return (
    <div className="add">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="想看的视频标题…（或粘贴 B 站链接的标题）"
      />
      <button className="btn" onClick={submit}>种下</button>
      <button className="btn btn-import" onClick={onOpenImport}>批量导入</button>
      <button className="btn btn-import" onClick={onOpenSync} title="把 B 站历史记录的观看进度同步进来">同步进度</button>
    </div>
  )
}
