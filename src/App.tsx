import { useMemo, useRef, useState } from 'react'
import { useGarden } from './hooks/useGarden'
import { nowOf, wiltingPlants } from './lib/garden'
import { Header } from './components/Header'
import { Stats } from './components/Stats'
import { AddPlant } from './components/AddPlant'
import { ReminderBanner } from './components/ReminderBanner'
import { Garden, type Filter } from './components/Garden'
import { Wishlist } from './components/Wishlist'
import { Footer } from './components/Footer'
import { Toast } from './components/Toast'
import { ImportModal } from './components/ImportModal'

export default function App() {
  const { state, addPlant, finish, remove, fastForward, reset, importMany, setRemindersEnabled } = useGarden()
  const [filter, setFilter] = useState<Filter>('todo')
  const [toast, setToast] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = (msg: string | null) => {
    if (!msg) return
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  const now = nowOf(state)
  const counts = useMemo(() => {
    const todo = state.plants.filter((p) => !p.watchedAt)
    const { wilt, crit } = wiltingPlants(state.plants, now)
    return {
      todo: todo.length,
      bloomed: state.plants.length - todo.length,
      wilt: wilt.length,
      crit: crit.length,
      wilting: wilt.length + crit.length,
    }
  }, [state.plants, now])

  return (
    <div className="wrap">
      <Header xp={state.xp} />
      <Stats todo={counts.todo} bloomed={counts.bloomed} wilting={counts.wilting} />
      <ReminderBanner
        wilt={counts.wilt}
        crit={counts.crit}
        remindersEnabled={state.reminders?.enabled ?? false}
        onToggleReminders={(on) => {
          setRemindersEnabled(on)
          if (on) showToast('开启提醒了 🔔 —— 标签页开着时，枯萎的草会来敲你')
        }}
        onSeeWilting={() => setFilter('todo')}
      />
      <AddPlant onAdd={addPlant} onOpenImport={() => setShowImport(true)} />
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={(items) => {
            if (items.length === 0) { showToast('先粘点东西进来吧 🌱'); return }
            const { planted, skipped } = importMany(items)
            if (planted === 0) showToast(`全部 ${skipped} 株已经在花园里了`)
            else if (skipped === 0) showToast(`种下了 ${planted} 株 🌱`)
            else showToast(`种下了 ${planted} 株 🌱，跳过 ${skipped} 株重复`)
          }}
        />
      )}
      <Garden
        plants={state.plants}
        now={now}
        filter={filter}
        onFilter={setFilter}
        onFinish={(id) => showToast(finish(id))}
        onRemove={remove}
      />
      <Wishlist />
      <Footer onFastForward={() => { fastForward(3); showToast('时间快进了 3 天 —— 看看谁开始枯萎了 🥀') }} onReset={reset} />
      <Toast msg={toast} />
    </div>
  )
}
