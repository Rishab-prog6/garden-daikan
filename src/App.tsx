import { useEffect, useMemo, useRef, useState } from 'react'
import { useGarden } from './hooks/useGarden'
import { parseBackup } from './lib/storage'
import { nowOf, wiltingPlants, fmtDay, todayPicks, currentStreak, dateKey } from './lib/garden'
import { CalendarView } from './components/CalendarView'
import { Header } from './components/Header'
import { Stats } from './components/Stats'
import { AddPlant } from './components/AddPlant'
import { DailyCard } from './components/DailyCard'
import { Wishlist } from './components/Wishlist'
import { Footer } from './components/Footer'
import { Toast } from './components/Toast'
import { ImportModal } from './components/ImportModal'
import { PlantDetailModal } from './components/PlantDetailModal'
import { ShareModal } from './components/ShareModal'

export default function App() {
  const { state, addPlant, finish, remove, fastForward, reset, importMany, setRemindersEnabled, setPlannedFor, restore } = useGarden()
  const [toast, setToast] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  /** 详情弹层里看的是哪株（存 id，数据实时跟 state 走） */
  const [detailId, setDetailId] = useState<number | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = (msg: string | null) => {
    if (!msg) return
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  const handlePlan = (id: number, ts: number | null) => {
    setPlannedFor(id, ts)
    showToast(ts ? `排好了 📅 ${fmtDay(ts)} 看这株` : '取消了这株的档期')
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const d = new Date()
    a.download = `待看花园备份-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    showToast('备份已导出 📦 收好别丢')
  }

  const importBackup = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = parseBackup(String(reader.result))
      if (!s) { showToast('这个文件读不懂 —— 确定是花园的备份吗？'); return }
      if (!window.confirm(`要用备份覆盖当前花园吗？\n备份里有 ${s.plants.length} 株，当前有 ${state.plants.length} 株。`)) return
      restore(s)
      showToast(`花园回来了 🌿 ${s.plants.length} 株安好`)
    }
    reader.readAsText(file)
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

  // tab 标题红点：有草在枯就把数字挂出来，切走的标签页也在提醒你
  useEffect(() => {
    document.title = counts.wilting > 0
      ? `(${counts.wilting}🥀) 待看花园 · build in bilibili`
      : '待看花园 · build in bilibili'
  }, [counts.wilting])

  return (
    <div className="wrap">
      <Header xp={state.xp} onShare={() => setShowShare(true)} />
      {showShare && <ShareModal state={state} now={now} onClose={() => setShowShare(false)} />}
      <Stats todo={counts.todo} bloomed={counts.bloomed} wilting={counts.wilting} />
      <DailyCard
        picks={todayPicks(state.plants, now)}
        todoCount={counts.todo}
        crit={counts.crit}
        streak={currentStreak(state.streak, now)}
        wateredToday={(state.streak?.lastDoneOn ?? null) === dateKey(now)}
        now={now}
        remindersEnabled={state.reminders?.enabled ?? false}
        onToggleReminders={(on) => {
          setRemindersEnabled(on)
          if (on) showToast('开启提醒了 🔔 —— 标签页开着时，枯萎的草会来敲你')
        }}
        onOpen={setDetailId}
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
      <CalendarView
        plants={state.plants}
        now={now}
        onPlan={handlePlan}
        onNotice={showToast}
        onOpen={setDetailId}
      />
      {(() => {
        const detail = state.plants.find((p) => p.id === detailId)
        return detail ? (
          <PlantDetailModal
            plant={detail}
            now={now}
            onClose={() => setDetailId(null)}
            onFinish={(id) => showToast(finish(id))}
            onRemove={remove}
            onPlan={handlePlan}
          />
        ) : null
      })()}
      <Wishlist />
      <Footer
        onFastForward={() => { fastForward(3); showToast('时间快进了 3 天 —— 看看谁开始枯萎了 🥀') }}
        onReset={reset}
        onExportBackup={exportBackup}
        onImportBackup={importBackup}
      />
      <Toast msg={toast} />
    </div>
  )
}
