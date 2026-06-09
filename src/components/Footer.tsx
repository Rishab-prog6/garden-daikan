export function Footer({ onFastForward, onReset }: { onFastForward: () => void; onReset: () => void }) {
  return (
    <div className="foot">
      <span className="ver">v0.1 · 数据已存在本机浏览器</span>
      <div className="demo">
        <span>演示模式：</span>
        <button onClick={onFastForward}>⏩ 快进 3 天</button>
        <button onClick={onReset}>重置</button>
      </div>
    </div>
  )
}
