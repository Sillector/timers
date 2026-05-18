import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc, collection, onSnapshot, setDoc, updateDoc,
  writeBatch, query, orderBy,
} from 'firebase/firestore'

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

export const PRESET_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFEAA7', '#A8E6CF',
  '#4ECDC4', '#45B7D1', '#74B9FF', '#A29BFE',
  '#FD79A8', '#E17055', '#00B894', '#0984E3',
  '#6C5CE7', '#FDCB6E', '#55EFC4', '#B2BEC3',
]

function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export const useTimerStore = defineStore('timer', () => {
  const activities = ref<Activity[]>([])
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string | null>(null)
  const initialized = ref(false)

  let _uid: string | null = null
  let _unsubConfig: (() => void) | null = null
  let _unsubSessions: (() => void) | null = null

  function init(uid: string) {
    if (_uid === uid) return
    _uid = uid

    const { db } = useFirebase()
    const configRef = doc(db, 'users', uid, 'data', 'config')
    const sessionsRef = collection(db, 'users', uid, 'sessions')

    _unsubConfig = onSnapshot(configRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        activities.value = data.activities ?? DEFAULT_ACTIVITIES
        currentSessionId.value = data.currentSessionId ?? null
      } else {
        // First-time user — create defaults and auto-start "Другое"
        const firstSessionId = genId()
        const otherId = DEFAULT_ACTIVITIES[DEFAULT_ACTIVITIES.length - 1].id
        await setDoc(configRef, {
          activities: DEFAULT_ACTIVITIES,
          currentSessionId: firstSessionId,
        })
        await setDoc(doc(db, 'users', uid, 'sessions', firstSessionId), {
          activityId: otherId,
          startTime: Date.now(),
          endTime: null,
        })
      }
      initialized.value = true
    })

    _unsubSessions = onSnapshot(
      query(sessionsRef, orderBy('startTime')),
      (snap) => {
        sessions.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Session))
      },
    )
  }

  function cleanup() {
    _unsubConfig?.()
    _unsubSessions?.()
    _unsubConfig = null
    _unsubSessions = null
    _uid = null
    activities.value = []
    sessions.value = []
    currentSessionId.value = null
    initialized.value = false
  }

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) ?? null,
  )

  const currentActivity = computed(() =>
    currentSession.value
      ? (activities.value.find(a => a.id === currentSession.value!.activityId) ?? null)
      : null,
  )

  async function startActivity(activityId: string) {
    if (!_uid || currentActivity.value?.id === activityId) return
    const { db } = useFirebase()
    const batch = writeBatch(db)

    if (currentSession.value && !currentSession.value.endTime) {
      batch.update(
        doc(db, 'users', _uid, 'sessions', currentSession.value.id),
        { endTime: Date.now() },
      )
    }

    const newSessionRef = doc(collection(db, 'users', _uid, 'sessions'))
    batch.set(newSessionRef, { activityId, startTime: Date.now(), endTime: null })
    batch.update(doc(db, 'users', _uid, 'data', 'config'), { currentSessionId: newSessionRef.id })

    await batch.commit()
  }

  async function _saveActivities() {
    if (!_uid) return
    const { db } = useFirebase()
    await updateDoc(doc(db, 'users', _uid, 'data', 'config'), {
      activities: activities.value,
    })
  }

  function getTodayTime(activityId: string, now: number): number {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    const dayStart = d.getTime()
    return sessions.value.reduce((total, s) => {
      if (s.activityId !== activityId) return total
      const end = s.endTime ?? now
      if (end < dayStart) return total
      return total + Math.max(0, Math.min(end, now) - Math.max(s.startTime, dayStart))
    }, 0)
  }

  function getTimeInRange(activityId: string, from: number, to: number, now: number): number {
    return sessions.value.reduce((total, s) => {
      if (s.activityId !== activityId) return total
      const end = s.endTime ?? now
      if (end < from || s.startTime > to) return total
      return total + Math.max(0, Math.min(end, to) - Math.max(s.startTime, from))
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

  async function addActivity(data: Omit<Activity, 'id'>) {
    activities.value.push({ ...data, id: genId() })
    await _saveActivities()
  }

  async function updateActivity(id: string, updates: Partial<Omit<Activity, 'id'>>) {
    const idx = activities.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      activities.value[idx] = { ...activities.value[idx], ...updates }
      await _saveActivities()
    }
  }

  async function deleteActivity(id: string) {
    if (activities.value.length <= 1) return
    if (currentActivity.value?.id === id) {
      const next = activities.value.find(a => a.id !== id)
      if (next) await startActivity(next.id)
    }
    activities.value = activities.value.filter(a => a.id !== id)
    await _saveActivities()
  }

  async function reorderActivities(ids: string[]) {
    const map = Object.fromEntries(activities.value.map(a => [a.id, a]))
    activities.value = ids.map(id => map[id]).filter(Boolean)
    await _saveActivities()
  }

  async function clearSessions() {
    if (!_uid) return
    const { db } = useFirebase()
    const batch = writeBatch(db)

    sessions.value.forEach(s => {
      batch.delete(doc(db, 'users', _uid!, 'sessions', s.id))
    })

    const newSessionRef = doc(collection(db, 'users', _uid, 'sessions'))
    const otherId = activities.value[activities.value.length - 1]?.id
    if (otherId) {
      batch.set(newSessionRef, { activityId: otherId, startTime: Date.now(), endTime: null })
      batch.update(doc(db, 'users', _uid, 'data', 'config'), { currentSessionId: newSessionRef.id })
    }

    await batch.commit()
  }

  return {
    activities, sessions, currentSessionId, currentSession, currentActivity, initialized,
    init, cleanup, startActivity, getTodayTime, getTimeInRange, getDaysInRange,
    formatDuration, addActivity, updateActivity, deleteActivity, reorderActivities, clearSessions,
  }
})
