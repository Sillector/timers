<template>
  <div class="timer-page">
  
    <!-- Header -->
    <header class="header">
      <div class="header-date">{{ todayLabel }}</div>
      <div class="header-total">
        Всего сегодня: <span>{{ formatDuration(totalToday) }}</span>
      </div>
    </header>

    <!-- Active block -->
    <div v-if="store.currentActivity" class="active-block" :style="{ '--act-color': store.currentActivity.color }">
      <div class="active-ring">
        <div class="active-ring-inner">{{ store.currentActivity.icon }}</div>
      </div>
      <div class="active-info">
        <div class="active-label">Сейчас активно</div>
        <div class="active-name">{{ store.currentActivity.name }}</div>
        <div class="active-timer">{{ formatDuration(currentElapsed) }}</div>
        <div class="active-total text-muted text-sm">
          Сегодня: {{ formatDuration(store.getTodayTime(store.currentActivity.id, now)) }}
        </div>
      </div>
    </div>

    <!-- Activity list -->
    <div class="activities-section">
      <div class="section-title">Занятия</div>
      <div class="activities-list">
        <div
          v-for="act in store.activities"
          :key="act.id"
          class="activity-row"
          :class="{ 'is-active': store.currentActivity?.id === act.id }"
          :style="{ '--act-color': act.color }"
        >
          <div class="act-icon">{{ act.icon }}</div>
          <div class="act-details">
            <div class="act-name">{{ act.name }}</div>
            <div class="act-time">
              <span v-if="store.currentActivity?.id === act.id" class="act-time-live">
                {{ formatDuration(store.getTodayTime(act.id, now)) }}
              </span>
              <span v-else class="text-muted">
                {{ store.getTodayTime(act.id, now) > 0 ? formatDuration(store.getTodayTime(act.id, now)) : '—' }}
              </span>
            </div>
          </div>
          <button
            class="play-btn"
            :class="{ 'is-active': store.currentActivity?.id === act.id }"
            :aria-label="`Начать ${act.name}`"
            @click="store.startActivity(act.id)"
          >
            <span v-if="store.currentActivity?.id === act.id" class="play-dot" />
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimerStore } from '~/stores/timer'

const store = useTimerStore()
const now = ref(Date.now())

let ticker: ReturnType<typeof setInterval>
onMounted(() => {
  ticker = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => clearInterval(ticker))

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
})

const currentElapsed = computed(() => {
  if (!store.currentSession) return 0
  return now.value - store.currentSession.startTime
})

const totalToday = computed(() => {
  return store.activities.reduce((sum, a) => sum + store.getTodayTime(a.id, now.value), 0)
})

function formatDuration(ms: number) {
  return store.formatDuration(ms)
}
</script>

<style scoped>
.timer-page { padding: 0 16px; }

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 16px;
}
.header-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  text-transform: capitalize;
}
.header-total { font-size: 13px; color: var(--text2); }
.header-total span { color: var(--text); font-weight: 600; }

/* Active block */
.active-block {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}
.active-block::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--act-color);
  opacity: .05;
  pointer-events: none;
}
.active-block::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--act-color);
  border-radius: 0 2px 2px 0;
}

.active-ring {
  position: relative;
  flex-shrink: 0;
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
}
.active-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--act-color);
  animation: pulse-ring 2s ease-out infinite;
}
.active-ring-inner {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--act-color) 15%, transparent);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
}
.active-info { flex: 1; min-width: 0; }
.active-label { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: var(--text2); margin-bottom: 2px; }
.active-name { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.active-timer {
  font-size: 32px;
  font-weight: 800;
  color: var(--act-color);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  margin-bottom: 4px;
}
.active-total { font-size: 13px; }

/* Section */
.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--text2);
  margin-bottom: 10px;
}

/* Activity list */
.activities-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: border-color .15s, background .15s;
}
.activity-row.is-active {
  border-color: color-mix(in srgb, var(--act-color) 40%, transparent);
  background: color-mix(in srgb, var(--act-color) 6%, var(--bg2));
}

.act-icon { font-size: 24px; line-height: 1; flex-shrink: 0; }

.act-details { flex: 1; min-width: 0; }
.act-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.act-time { font-size: 13px; margin-top: 2px; font-variant-numeric: tabular-nums; }
.act-time-live { color: var(--act-color); font-weight: 600; }

.play-btn {
  flex-shrink: 0;
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, transform .1s;
  background: color-mix(in srgb, var(--act-color) 15%, transparent);
  color: var(--act-color);
}
.play-btn svg { width: 16px; height: 16px; margin-left: 2px; }
.play-btn:active { transform: scale(.9); }
.play-btn.is-active {
  background: var(--act-color);
  color: #000;
}

.play-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}
</style>
