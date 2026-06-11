export function Stats({ todo, bloomed, wilting }: { todo: number; bloomed: number; wilting: number }) {
  return (
    <div className="stats">
      <div className="stat">
        <div className="n">{todo}</div>
        <div className="l">待看的草</div>
      </div>
      <div className="stat">
        <div className="n" style={{ color: 'var(--bloom)' }}>{bloomed}</div>
        <div className="l">已开花</div>
      </div>
      <div className={'stat' + (wilting ? ' warn' : '')}>
        <div className="n">{wilting}</div>
        <div className="l">{wilting ? '正在枯萎 · 需要救' : '枯萎中'}</div>
      </div>
    </div>
  )
}
