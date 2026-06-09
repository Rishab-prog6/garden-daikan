export function Toast({ msg }: { msg: string | null }) {
  return <div className={'toast' + (msg ? ' show' : '')}>{msg}</div>
}
