import type { Plant } from '../types'

interface Props {
  plant: Plant
  onFinish: () => void
  onPartial: () => void
  onNotYet: () => void
}

/** 从 B 站回来时弹的确认条 —— 半自动同步：花园知道你出过门，回来一键开花 */
export function WelcomeBack({ plant, onFinish, onPartial, onNotYet }: Props) {
  return (
    <div className="welcome">
      <span className="welcome-text">刚从 B 站回来 ——「{plant.title}」看完了吗？</span>
      <div className="welcome-actions">
        <button className="btn" onClick={onFinish}>看完了 ✓</button>
        <button className="btn btn-ghost" onClick={onPartial}>看了一部分</button>
        <button className="btn btn-ghost" onClick={onNotYet}>还没看</button>
      </div>
    </div>
  )
}
