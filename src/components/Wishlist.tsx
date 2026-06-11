export function Wishlist() {
  const items = [
    ['自动导入收藏夹', '呼声最高'],
    ['好友花园 PK', '传播向'],
    ['枯萎前提醒', '留存向'],
    ['数据周报', '分享向'],
  ]
  return (
    <div className="wish">
      <h3>🗳 弹幕共建 · 功能许愿池</h3>
      <p>
        下期加什么由弹幕投票决定。评论区留言 + 投币,我会把高频需求整理进这里,
        让观众真的参与产品路线。
      </p>
      <div className="wish-grid">
        {items.map(([name, tag]) => (
          <span key={name}><b>{name}</b><em>{tag}</em></span>
        ))}
      </div>
    </div>
  )
}
