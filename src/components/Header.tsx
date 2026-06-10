import { xpInLevel } from '../lib/garden'

export function Header({ xp, onShare }: { xp: number; onShare: () => void }) {
  const { lv, cur, span } = xpInLevel(xp)
  return (
    <div className="top">
      <div className="brand">
        <span className="logo">build in bilibili</span>
        <h1>
          待看花<span className="pin">园</span>
        </h1>
        <div className="tag">收藏从未停止,学习从未开始 —— 那就让收藏夹长出点东西。</div>
      </div>
      <div className="topright">
        <div className="lv">
          <div className="lab">LV</div>
          <div className="num">{lv}</div>
          <div className="xpbar">
            <i style={{ width: `${Math.round((cur / span) * 100)}%` }} />
          </div>
        </div>
        <button className="share-btn" onClick={onShare}>📸 晒花园</button>
      </div>
    </div>
  )
}
