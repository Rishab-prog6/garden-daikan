interface Props {
  onUseSample: () => void
  onClose: () => void
}

export function OnboardingModal({ onUseSample, onClose }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal onboard">
        <span className="modal-kicker">BUILD IN BILIBILI</span>
        <h2 className="modal-title">把待看清单养成一座会催你的花园</h2>
        <p className="modal-hint">
          种下 B 站视频,看完就开花;拖太久会枯萎。同步进度只吃你主动粘贴的观看记录,
          云同步只上传端到端加密后的花园数据。
        </p>
        <div className="onboard-steps">
          <div><b>1</b><span>导入或粘贴视频</span></div>
          <div><b>2</b><span>排期、提醒、同步进度</span></div>
          <div><b>3</b><span>开花、升级、晒周报</span></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>直接开始</button>
          <button className="btn" onClick={onUseSample}>载入示例花园</button>
        </div>
      </div>
    </div>
  )
}
