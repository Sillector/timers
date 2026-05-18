<template>
  <div class="stats-page">
    <header class="stats-header">
      <h1 class="page-title">Статистика</h1>
    </header>

    <!-- Period tabs -->
    <div class="period-tabs">
      <button
        v-for="p in periods"
        :key="p.key"
        class="period-tab"
        :class="{ active: period === p.key }"
        @click="period = p.key"
      >{{ p.label }}</button>
    </div>

    <!-- Summary total -->
    <div class="summary-card card">
      <div class="summary-label">Всего за период</div>
      <div class="summary-value">{{ store.formatDuration(totalTime) }}</div>
      <div class="summary-sub text-muted text-sm">{{ periodSubLabel }}</div>
    </div>

    <!-- Bar chart -->
    <div v-if="chartData.length" class="chart-section">
      <div class="section-title">Распределение</div>
      <div class="chart-list">
        <div v-for="item in chartData" :key="item.id" class="chart-row">
          <div class="chart-icon">{{ item.icon }}</div>
          <div class="chart-body">
            <div class="chart-top">
              <span class="chart-name">{{ item.name }}</span>
              <span class="chart-time" :style="{ color: item.color }">{{ store.formatDuration(item.time, true) }}</span>
            </div>
            <div class="chart-bar-track">
              <div
                class="chart-bar-fill"
                :style="{ width: item.pct + '%', background: item.color }"
              />
            </div>
            <div class="chart-pct text-xs text-muted">{{ item.pct }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily breakdown (for week/month) -->
    <div v-if="(period === 'week' || period === 'month') && dailyData.length" class="daily-section">
      <div class="section-title">По дням</div>
      <div class="daily-list">
        <div v-for="day in dailyData" :key="day.dateKey" class="daily-row card">
          <div class="daily-date">{{ day.label }}</div>
          <div class="daily-bars">
            <div
              v-for="seg in day.segments"
              :key="seg.id"
              class="daily-seg"
              :style="{ width: seg.pct + '%', background: seg.color }"
              :title="`${seg.name}: ${store.formatDuration(seg.time, true)}`"
            />
          </div>
          <div class="daily-total text-sm text-muted">{{ store.formatDuration(day.total) }}</div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!chartData.length" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">Нет данных за этот период</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimerStore } from '~/stores/timer'

const store = useTimerStore()
const now = ref(Date.now())

let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { now.value = Date.now() }, 5000) })
onUnmounted(() => clearInterval(ticker))

type Period = 'today' | 'week' | 'month' | 'all'
const period = ref<Period>('today')

const periods = [
  { key: 'today' as Period, label: 'Сегодня' },
  { key: 'week' as Period, label: 'Неделя' },
  { key: 'month' as Period, label: 'Месяц' },
  { key: 'all' as Period, label: 'Всё время' },
]

const periodRange = computed((): [number, number] => {
  const n = now.value
  const d = new Date(n)

  if (period.value === 'today') {
    d.setHours(0, 0, 0, 0)
    return [d.getTime(), n]
  }
  if (period.value === 'week') {
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    d.setHours(0, 0, 0, 0)
    return [d.getTime(), n]
  }
  if (period.value === 'month') {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return [d.getTime(), n]
  }
  // all
  const earliest = store.sessions.reduce((min, s) => Math.min(min, s.startTime), n)
  return [earliest, n]
})

const periodSubLabel = computed(() => {
  const [from, to] = periodRange.value
  const fmt = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${fmt(from)} — ${fmt(to)}`
})

const chartData = computed(() => {
  const [from, to] = periodRange.value
  const items = store.activities.map(act => ({
    id: act.id,
    name: act.name,
    icon: act.icon,
    color: act.color,
    time: store.getTimeInRange(act.id, from, to, now.value),
    pct: 0,
  })).filter(i => i.time > 0).sort((a, b) => b.time - a.time)

  const total = items.reduce((s, i) => s + i.time, 0)
  if (total > 0) items.forEach(i => { i.pct = Math.round((i.time / total) * 100) })
  return items
})

const totalTime = computed(() => chartData.value.reduce((s, i) => s + i.time, 0))

const dailyData = computed(() => {
  const [from, to] = periodRange.value
  const map = store.getDaysInRange(from, to, now.value)
  const result = []

  for (const [dateKey, actMap] of map) {
    const total = [...actMap.values()].reduce((s, v) => s + v, 0)
    if (total === 0) continue

    const d = new Date(dateKey)
    const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })

    const segments = store.activities
      .filter(a => actMap.has(a.id))
      .map(a => ({
        id: a.id,
        name: a.name,
        color: a.color,
        time: actMap.get(a.id) ?? 0,
        pct: Math.round(((actMap.get(a.id) ?? 0) / total) * 100),
      }))
      .sort((a, b) => b.time - a.time)

    result.push({ dateKey, label, total, segments })
  }
  return result.reverse()
})
</script>

<style scoped>
.stats-page { padding: 0 16px; }

.stats-header { padding: 20px 0 16px; }
.page-title { font-size: 22px; font-weight: 700; }

.period-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.period-tabs::-webkit-scrollbar { display: none; }
.period-tab {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
}
.period-tab.active {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}

.summary-card {
  margin-bottom: 24px;
  text-align: center;
  padding: 24px;
}
.summary-label { font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: var(--text2); margin-bottom: 8px; }
.summary-value { font-size: 48px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text); line-height: 1; margin-bottom: 8px; }
.summary-sub { font-size: 13px; }

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--text2);
  margin-bottom: 12px;
}

/* Chart */
.chart-section { margin-bottom: 24px; }
.chart-list { display: flex; flex-direction: column; gap: 12px; }
.chart-row { display: flex; align-items: flex-start; gap: 12px; }
.chart-icon { font-size: 22px; margin-top: 2px; flex-shrink: 0; }
.chart-body { flex: 1; min-width: 0; }
.chart-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.chart-name { font-size: 14px; font-weight: 600; color: var(--text); }
.chart-time { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.chart-bar-track {
  height: 8px;
  background: var(--bg3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}
.chart-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width .4s ease;
}
.chart-pct { font-size: 11px; }

/* Daily */
.daily-section { margin-bottom: 24px; }
.daily-list { display: flex; flex-direction: column; gap: 8px; }
.daily-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
.daily-date { font-size: 13px; font-weight: 600; color: var(--text); width: 90px; flex-shrink: 0; text-transform: capitalize; }
.daily-bars {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  background: var(--bg3);
}
.daily-seg { height: 100%; transition: width .3s; }
.daily-total { font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; width: 56px; text-align: right; flex-shrink: 0; }

/* Empty */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text2);
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 16px; }
</style>
