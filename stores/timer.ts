import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Activity {
  id: string
  name: string
  icon: string
  color: string
}

export interface Session {
  id: string
  activityId: string
  startTime: number
  endTime: number | null
}

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'family', name: 'Семья', icon: '👨‍👩‍👧', color: '#FF6B6B' },
  { id: 'project', name: 'Проект', icon: '🚀', color: '#4ECDC4' },
  { id: 'work', name: 'Работа', icon: '💼', color: '#45B7D1' },
  { id: 'fun', name: 'Развлечения', icon: '🎮', color: '#FFEAA7' },
  { id: 'sleep', name: 'Сон', icon: '😴', color: '#A29BFE' },
  { id: 'other', name: 'Другое', icon: '📌', color: '#FD79A8' },
]

const ACTIVITIES_KEY = 'tt_activities'
const SESSIONS_KEY = 'tt_sessions'
const CURRENT_KEY = 'tt_current'

function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFEAA7', '#A8E6CF',
  '#4ECDC4', '#45B7D1', '#74B9FF', '#A29BFE',
  '#FD79A8', '#E17055', '#00B894', '#0984E3',
  '#6C5CE7', '#FDCB6E', '#55EFC4', '#B2BEC3',
]

export const useTimerStore = defineStore('timer', () => {
  const activities = ref<Activity[]>([])
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string | null>(null)
  const initialized = ref(false)

  function init() {
    if (!import.meta.client || initialized.value) return

    const a = localStorage.getItem(ACTIVITIES_KEY)
    activities.value = a ? JSON.parse(a) : [...DEFAULT_ACTIVITIES]

    const s = localStorage.getItem(SESSIONS_KEY)
    sessions.value = s ? JSON.parse(s) : []

    const c = localStorage.getItem(CURRENT_KEY)
    if (c) {
      const exists = sessions.value.find(s => s.id === c)
      currentSessionId.value = exists ? c : null
    }

    // Auto-start "other" if nothing is active
    if (!currentSessionId.value) {
      const otherId = activities.value[activities.value.length - 1]?.id
      if (otherId) _startActivity(otherId)
    }

    initialized.value = true
  }

  function _saveActivities() {
    if (import.meta.client) localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities.value))
  }
  function _saveSessions() {
    if (import.meta.client) localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.value))
  }
  function _saveCurrent() {
    if (!import.meta.client) return
    if (currentSessionId.value) localStorage.setItem(CURRENT_KEY, currentSessionId.value)
    else localStorage.removeItem(CURRENT_KEY)
  }

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) ?? null
  )

  const currentActivity = computed(() =>
    currentSession.value
      ? (activities.value.find(a => a.id === currentSession.value!.activityId) ?? null)
      : null
  )

  function _startActivity(activityId: string) {
    if (currentSession.value && !currentSession.value.endTime) {
      currentSession.value.endTime = Date.now()
    }
    const session: Session = { id: genId(), activityId, startTime: Date.now(), endTime: null }
    sessions.value.push(session)
    currentSessionId.value = session.id
    _saveSessions()
    _saveCurrent()
  }

  function startActivity(activityId: string) {
    if (currentActivity.value?.id === activityId) return
    _startActivity(activityId)
  }

  function getTodayTime(activityId: string, now: number): number {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    const dayStart = d.getTime()

    return sessions.value.reduce((total, s) => {
      if (s.activityId !== activityId) return total
      const end = s.endTime ?? now
      if (end < dayStart) return total
      const start = Math.max(s.startTime, dayStart)
      const actualEnd = Math.min(end, now)
      return total + Math.max(0, actualEnd - start)
    }, 0)
  }

  function getTimeInRange(activityId: string, from: number, to: number, now: number): number {
    return sessions.value.reduce((total, s) => {
      if (s.activityId !== activityId) return total
      const end = s.endTime ?? now
      if (end < from || s.startTime > to) return total
      const start = Math.max(s.startTime, from)
      const actualEnd = Math.min(end, to)
      return total + Math.max(0, actualEnd - start)
    }, 0)
  }

  function getDaysInRange(from: number, to: number, now: number): Map<string, Map<string, number>> {
    const result = new Map<string, Map<string, number>>()
    const current = new Date(from)
    current.setHours(0, 0, 0, 0)

    while (current.getTime() <= to) {
      const dayKey = current.toISOString().slice(0, 10)
      const dayStart = current.getTime()
      const dayEnd = Math.min(dayStart + 86400000, to, now)

      const dayMap = new Map<string, number>()
      for (const act of activities.value) {
        const t = getTimeInRange(act.id, dayStart, dayEnd, now)
        if (t > 0) dayMap.set(act.id, t)
      }
      if (dayMap.size > 0) result.set(dayKey, dayMap)

      current.setDate(current.getDate() + 1)
    }
    return result
  }

  function formatDuration(ms: number, short = false): string {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (short) {
      if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`
      if (m > 0) return `${m}м ${String(s).padStart(2, '0')}с`
      return `${s}с`
    }
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function addActivity(data: Omit<Activity, 'id'>) {
    activities.value.push({ ...data, id: genId() })
    _saveActivities()
  }

  function updateActivity(id: string, updates: Partial<Omit<Activity, 'id'>>) {
    const idx = activities.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      activities.value[idx] = { ...activities.value[idx], ...updates }
      _saveActivities()
    }
  }

  function deleteActivity(id: string) {
    if (activities.value.length <= 1) return
    if (currentActivity.value?.id === id) {
      const next = activities.value.find(a => a.id !== id)
      if (next) _startActivity(next.id)
    }
    activities.value = activities.value.filter(a => a.id !== id)
    _saveActivities()
  }

  function reorderActivities(ids: string[]) {
    const map = Object.fromEntries(activities.value.map(a => [a.id, a]))
    activities.value = ids.map(id => map[id]).filter(Boolean)
    _saveActivities()
  }

  function clearSessions() {
    sessions.value = []
    currentSessionId.value = null
    _saveSessions()
    _saveCurrent()
    const otherId = activities.value[activities.value.length - 1]?.id
    if (otherId) _startActivity(otherId)
  }

  return {
    activities,
    sessions,
    currentSessionId,
    currentSession,
    currentActivity,
    initialized,
    init,
    startActivity,
    getTodayTime,
    getTimeInRange,
    getDaysInRange,
    formatDuration,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    clearSessions,
  }
})
