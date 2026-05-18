<template>
  <div class="settings-page">
    <header class="settings-header">
      <h1 class="page-title">Занятия</h1>
      <button class="btn btn-ghost" style="font-size:13px" @click="openAdd">+ Добавить</button>
    </header>

    <div class="section-title">Список занятий</div>
    <div class="activity-list">
      <div
        v-for="(act, idx) in store.activities"
        :key="act.id"
        class="activity-item card"
        :style="{ '--act-color': act.color }"
      >
        <div class="act-top">
          <div class="act-color-dot" :style="{ background: act.color }" />
          <div class="act-icon">{{ act.icon }}</div>
          <div class="act-name">{{ act.name }}</div>
        </div>
        <div class="act-actions">
          <button class="icon-btn" title="Вверх" :disabled="idx === 0" @click="move(idx, -1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button class="icon-btn" title="Вниз" :disabled="idx === store.activities.length - 1" @click="move(idx, 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button class="icon-btn" title="Редактировать" @click="openEdit(act)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn danger" title="Удалить" :disabled="store.activities.length <= 1" @click="confirmDelete(act)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="danger-zone">
      <div class="section-title" style="color: #f85149">Опасная зона</div>
      <div class="card">
        <p class="text-sm text-muted" style="margin-bottom:12px">Очистить все сессии и начать заново</p>
        <button class="btn btn-danger w-full" @click="confirmClear = true">Сбросить все данные</button>
      </div>
    </div>

    <!-- Edit / Add Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-title">{{ modal.isEdit ? 'Редактировать занятие' : 'Новое занятие' }}</div>

          <div class="field">
            <label class="field-label">Название</label>
            <input v-model="modal.name" class="input" placeholder="Например: Спорт" maxlength="30" />
          </div>

          <div class="field">
            <label class="field-label">Иконка (эмодзи)</label>
            <div class="emoji-wrap">
              <input v-model="modal.icon" class="input emoji-input" placeholder="🏋️" maxlength="4" />
              <div class="emoji-presets">
                <button v-for="e in emojiPresets" :key="e" class="emoji-preset-btn" @click="modal.icon = e">{{ e }}</button>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Цвет</label>
            <div class="color-grid">
              <button
                v-for="c in PRESET_COLORS"
                :key="c"
                class="color-swatch"
                :class="{ selected: modal.color === c }"
                :style="{ background: c }"
                @click="modal.color = c"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="closeModal">Отмена</button>
            <button
              class="btn btn-primary"
              :disabled="!modal.name.trim() || !modal.icon.trim()"
              :style="{ background: modal.color, color: '#000' }"
              @click="saveModal"
            >
              {{ modal.isEdit ? 'Сохранить' : 'Добавить' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm delete -->
      <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
        <div class="modal">
          <div class="modal-title">Удалить занятие?</div>
          <p class="text-sm text-muted" style="margin-bottom:20px">
            «{{ deleteTarget.name }}» будет удалено. Все записанные сессии сохранятся, но будут недоступны.
          </p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="deleteTarget = null">Отмена</button>
            <button class="btn btn-danger" @click="doDelete">Удалить</button>
          </div>
        </div>
      </div>

      <!-- Confirm clear -->
      <div v-if="confirmClear" class="modal-backdrop" @click.self="confirmClear = false">
        <div class="modal">
          <div class="modal-title">Сбросить все данные?</div>
          <p class="text-sm text-muted" style="margin-bottom:20px">
            Все сессии будут удалены. Список занятий сохранится.
          </p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="confirmClear = false">Отмена</button>
            <button class="btn btn-danger" @click="doClear">Сбросить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useTimerStore, PRESET_COLORS, type Activity } from '~/stores/timer'

const store = useTimerStore()

const emojiPresets = ['👨‍👩‍👧', '🚀', '💼', '🎮', '😴', '📌', '🏋️', '📚', '🎨', '🍳', '🚗', '💊', '🎵', '🏃', '💻', '🌿']

const modal = reactive({
  open: false,
  isEdit: false,
  editId: '',
  name: '',
  icon: '📌',
  color: PRESET_COLORS[0],
})

function openAdd() {
  modal.open = true
  modal.isEdit = false
  modal.editId = ''
  modal.name = ''
  modal.icon = '📌'
  modal.color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}

function openEdit(act: Activity) {
  modal.open = true
  modal.isEdit = true
  modal.editId = act.id
  modal.name = act.name
  modal.icon = act.icon
  modal.color = act.color
}

function closeModal() { modal.open = false }

function saveModal() {
  if (!modal.name.trim() || !modal.icon.trim()) return
  if (modal.isEdit) {
    store.updateActivity(modal.editId, { name: modal.name.trim(), icon: modal.icon.trim(), color: modal.color })
  } else {
    store.addActivity({ name: modal.name.trim(), icon: modal.icon.trim(), color: modal.color })
  }
  closeModal()
}

const deleteTarget = ref<Activity | null>(null)
function confirmDelete(act: Activity) { deleteTarget.value = act }
function doDelete() {
  if (deleteTarget.value) store.deleteActivity(deleteTarget.value.id)
  deleteTarget.value = null
}

const confirmClear = ref(false)
function doClear() {
  store.clearSessions()
  confirmClear.value = false
}

function move(idx: number, dir: -1 | 1) {
  const ids = store.activities.map(a => a.id)
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= ids.length) return;
  [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]]
  store.reorderActivities(ids)
}
</script>

<style scoped>
.settings-page { padding: 0 16px; }

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 16px;
}
.page-title { font-size: 22px; font-weight: 700; }

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--text2);
  margin-bottom: 10px;
}

.activity-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 28px; }

.activity-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
}
.act-top { display: flex; align-items: center; gap: 10px; }
.act-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.act-icon { font-size: 22px; flex-shrink: 0; }
.act-name { flex: 1; font-size: 15px; font-weight: 600; }
.act-actions { display: flex; gap: 6px; }

.icon-btn {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--bg3);
  color: var(--text2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s, background .15s;
}
.icon-btn svg { width: 15px; height: 15px; }
.icon-btn:hover:not(:disabled) { color: var(--text); background: var(--border); }
.icon-btn:disabled { opacity: .3; cursor: default; }
.icon-btn.danger:hover:not(:disabled) { color: #f85149; background: rgba(248,81,73,.1); }

.danger-zone { margin-bottom: 24px; }

/* Modal fields */
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
.field { margin-bottom: 16px; }
.field-label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: var(--text2); margin-bottom: 8px; }

.emoji-wrap { display: flex; flex-direction: column; gap: 8px; }
.emoji-input { width: 72px; font-size: 24px; text-align: center; padding: 8px; }
.emoji-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.emoji-preset-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg3);
  font-size: 18px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.emoji-preset-btn:hover { background: var(--border); }

.color-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
.color-swatch {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform .1s, border-color .1s;
}
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.selected { border-color: var(--text); transform: scale(1.15); }

.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.modal-actions .btn { flex: 1; }
.btn-primary {
  font-weight: 700;
  border: none;
  padding: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
}
.btn-primary:disabled { opacity: .5; cursor: default; }
</style>
