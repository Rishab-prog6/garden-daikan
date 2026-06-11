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
import { WelcomeBack } from './components/WelcomeBack'
import { SyncModal } from './components/SyncModal'
import type { SyncMatch } from './lib/syncParse'
import { CloudModal } from './components/CloudModal'
import type { SyncStatus } from './components/CloudModal'
import { OnboardingModal } from './components/OnboardingModal'
import { AchievementPanel } from './components/AchievementPanel'
import { buildAchievements } from './lib/achievements'
import { sampleGarden } from './lib/sample'
import {
  cloudReady, genKey, normalizeKey, pushGarden, pullGarden,
  loadCloudKey, saveCloudKey, loadLastSavedAt, saveLastSavedAt,
} from './lib/cloud'

const ONBOARDING_KEY = 'daikan-garden:onboarded'

export default function App() {
  const {
    state, addPlant, finish, remove, fastForward, reset, importMany,
    setRemindersEnabled, setPlannedFor, restore, markVisited, clearVisited, setProgress,
  } = useGarden()
  const [toast, setToast] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [showCloud, setShowCloud] = useState(false)
  const [cloudKey, setCloudKey] = useState<string | null>(() => loadCloudKey())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)
  const [initialCloudChecked, setInitialCloudChecked] = useState(() => !loadCloudKey() || !cloudReady())
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) !== '1' } catch { return false }
  })
  /** 详情弹层里看的是哪株（存 id，数据实时跟 state 走） */
  const [detailId, setDetailId] = useState<number | null>(null)
  /** 从 B 站回来要确认的那株 */
  const [welcomeId, setWelcomeId] = useState<number | null>(null)
  /** 录屏调试入口：URL 带 ?demo=1 才露出快进/重置 */
  const demoMode = useMemo(() => new URLSearchParams(window.location.search).has('demo'), [])
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = (msg: string | null) => {
    if (!msg) return
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  const closeOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch { /* ignored */ }
    setShowOnboarding(false)
  }

  const loadSampleGarden = () => {
    restore(sampleGarden(nowOf(state)))
    closeOnboarding()
    showToast('示例花园已载入 —— 可以直接录屏演示了')
  }

  const handlePlan = (id: number, ts: number | null) => {
    setPlannedFor(id, ts)
    showToast(ts ? `排好了 📅 ${fmtDay(ts)} 看这株` : '取消了这株的档期')
  }

  /** 推一次云（加密后上传），共用的小帮手 */
  const pushToCloud = async (key: string) => {
    setSyncStatus('syncing')
    try {
      const savedAt = await pushGarden(key, stateRefForCloud.current)
      saveLastSavedAt(savedAt)
      setLastSyncAt(savedAt)
      setSyncStatus('ok')
    } catch {
      setSyncStatus('error')
    }
  }
  // push 时要拿最新 state，但又不想把 state 放进各回调的依赖里
  const stateRefForCloud = useRef(state)
  stateRefForCloud.current = state

  // 自动上云：花园有改动且开了同步，1.5s 防抖推一次
  const cloudTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!cloudKey || !cloudReady() || !initialCloudChecked) return
    window.clearTimeout(cloudTimer.current)
    cloudTimer.current = window.setTimeout(() => pushToCloud(cloudKey), 1500)
    return () => window.clearTimeout(cloudTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cloudKey, initialCloudChecked])

  // 启动时拉云端：比本机新就用云端的（多设备场景：后写的赢）
  useEffect(() => {
    if (!cloudKey || !cloudReady()) {
      setInitialCloudChecked(true)
      return
    }
    pullGarden(cloudKey)
      .then((payload) => {
        if (payload && payload.savedAt > loadLastSavedAt()) {
          restore(payload.state)
          saveLastSavedAt(payload.savedAt)
          setLastSyncAt(payload.savedAt)
          setSyncStatus('ok')
          showToast(`云端拉到了更新 —— ${payload.state.plants.length} 株已同步 ☁`)
        }
      })
      .catch(() => setSyncStatus('error'))
      .finally(() => setInitialCloudChecked(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enableCloud = () => {
    const key = genKey()
    saveCloudKey(key)
    setCloudKey(key)
    setInitialCloudChecked(true)
    pushToCloud(key)
    showToast('钥匙生成了 —— 抄好它，这是花园唯一的门')
  }

  const restoreWithKey = async (raw: string) => {
    const key = normalizeKey(raw)
    if (!key) { showToast('这把钥匙的形状不对 —— 检查一下？'); return }
    setSyncStatus('syncing')
    try {
      const payload = await pullGarden(key)
      if (!payload) { setSyncStatus('idle'); showToast('这把钥匙下面还没有花园'); return }
      if (state.plants.length > 0
        && !window.confirm(`用钥匙里的花园（${payload.state.plants.length} 株）覆盖当前（${state.plants.length} 株）？`)) {
        setSyncStatus('idle')
        return
      }
      restore(payload.state)
      saveCloudKey(key)
      setCloudKey(key)
      setInitialCloudChecked(true)
      saveLastSavedAt(payload.savedAt)
      setLastSyncAt(payload.savedAt)
      setSyncStatus('ok')
      showToast(`花园回来了 🌿 ${payload.state.plants.length} 株安好`)
    } catch {
      setSyncStatus('error')
      showToast('云端没接通 —— 网络问题，稍后再试')
    }
  }

  const disableCloud = () => {
    saveCloudKey(null)
    setCloudKey(null)
    setInitialCloudChecked(true)
    setSyncStatus('idle')
    showToast('本机退出同步了 —— 云端还留着，凭钥匙随时回来')
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
  const achievements = useMemo(() => buildAchievements(state, now), [state, now])

  // tab 标题红点：有草在枯就把数字挂出来，切走的标签页也在提醒你
  useEffect(() => {
    document.title = counts.wilting > 0
      ? `(${counts.wilting}🥀) 待看花园 · build in bilibili`
      : '待看花园 · build in bilibili'
  }, [counts.wilting])

  // 半自动同步：从 B 站切回来时，问问刚才出门看的那株看完了没。
  // 出门不足 90 秒大概率没看完不问；超过 6 小时过期也不问。
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      const nowReal = Date.now()
      const cand = state.plants
        .filter((p) => !p.watchedAt && p.visitedAt
          && nowReal - p.visitedAt >= 90_000
          && nowReal - p.visitedAt <= 6 * 3600_000)
        .sort((a, b) => (b.visitedAt ?? 0) - (a.visitedAt ?? 0))[0]
      if (cand) setWelcomeId(cand.id)
    }
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    check()
    return () => {
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [state.plants])

  const handleProgress = (id: number, pct: number) => {
    if (pct >= 100) {
      showToast(finish(id))
      setDetailId(null)
    } else {
      setProgress(id, pct)
    }
  }

  /** 应用历史记录同步结果：到头的开花，没到头的更新进度条 */
  const applySync = (matches: SyncMatch[]) => {
    let bloomed = 0
    let updated = 0
    for (const m of matches) {
      if (m.willBloom) { finish(m.plantId); bloomed++ }
      else { setProgress(m.plantId, m.newPct); updated++ }
    }
    showToast(
      bloomed > 0
        ? `同步好了：${bloomed} 株开花 🌸${updated > 0 ? `，${updated} 株进度更新` : ''}`
        : `同步好了：${updated} 株进度更新 🌿`,
    )
  }

  return (
    <div className="wrap">
      <Header xp={state.xp} onShare={() => setShowShare(true)} />
      {showOnboarding && <OnboardingModal onUseSample={loadSampleGarden} onClose={closeOnboarding} />}
      {showShare && <ShareModal state={state} now={now} onClose={() => setShowShare(false)} />}
      <Stats todo={counts.todo} bloomed={counts.bloomed} wilting={counts.wilting} />
      <AchievementPanel achievements={achievements} />
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
      <AddPlant onAdd={addPlant} onOpenImport={() => setShowImport(true)} onOpenSync={() => setShowSync(true)} />
      {showSync && (
        <SyncModal
          plants={state.plants}
          onApply={applySync}
          onNotice={showToast}
          onClose={() => setShowSync(false)}
        />
      )}
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
            onProgress={handleProgress}
            onVisited={markVisited}
          />
        ) : null
      })()}
      {(() => {
        const wp = state.plants.find((p) => p.id === welcomeId && !p.watchedAt)
        return wp ? (
          <WelcomeBack
            plant={wp}
            onFinish={() => { showToast(finish(wp.id)); clearVisited(wp.id); setWelcomeId(null) }}
            onPartial={() => { clearVisited(wp.id); setWelcomeId(null); setDetailId(wp.id) }}
            onNotYet={() => { clearVisited(wp.id); setWelcomeId(null) }}
          />
        ) : null
      })()}
      <Wishlist />
      <Footer
        onFastForward={() => { fastForward(3); showToast('时间快进了 3 天 —— 看看谁开始枯萎了 🥀') }}
        onReset={reset}
        onExportBackup={exportBackup}
        onImportBackup={importBackup}
        demoMode={demoMode}
        cloudOn={cloudKey !== null}
        onOpenCloud={() => setShowCloud(true)}
      />
      {showCloud && (
        <CloudModal
          cloudKey={cloudKey}
          status={syncStatus}
          lastSyncAt={lastSyncAt}
          onEnable={enableCloud}
          onRestore={restoreWithKey}
          onSyncNow={() => cloudKey && pushToCloud(cloudKey)}
          onDisable={disableCloud}
          onClose={() => setShowCloud(false)}
        />
      )}
      <Toast msg={toast} />
    </div>
  )
}
