<template>
  <div class="page-wrap">
    <!-- Loading -->
    <div v-if="auth.loading" class="splash">
      <div class="splash-ring" />
    </div>

    <!-- Login -->
    <div v-else-if="!auth.user" class="login-page">
      <div class="login-card">
        <div class="login-logo">⏱️</div>
        <h1 class="login-title">Time Tracker</h1>
        <p class="login-sub">Отслеживай время по занятиям</p>
        <button class="btn-google" :disabled="loggingIn" @click="handleLogin">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ loggingIn ? 'Входим...' : 'Войти через Google' }}
        </button>
      </div>
    </div>

    <!-- App -->
    <template v-else>
      <VitePwaManifest />
      <NuxtPage />
      <nav class="bottom-nav">
        <NuxtLink to="/" class="nav-btn" :class="{ active: route.path === '/' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Таймер
        </NuxtLink>
        <NuxtLink to="/stats" class="nav-btn" :class="{ active: route.path === '/stats' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Статистика
        </NuxtLink>
        <NuxtLink to="/settings" class="nav-btn" :class="{ active: route.path === '/settings' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Занятия
        </NuxtLink>
        <button class="nav-btn" @click="auth.logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Выйти
        </button>
      </nav>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuthStore()
const store = useTimerStore()
const loggingIn = ref(false)

onMounted(() => auth.init())

watch(() => auth.user, (user) => {
  if (user) store.init(user.uid)
  else store.cleanup()
}, { immediate: true })

async function handleLogin() {
  loggingIn.value = true
  try { await auth.login() }
  finally { loggingIn.value = false }
}
</script>

<style scoped>
/* Splash */
.splash {
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.splash-ring {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: #4ECDC4;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Login */
.login-page {
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.login-card {
  text-align: center;
  max-width: 320px;
  width: 100%;
}
.login-logo { font-size: 64px; margin-bottom: 16px; }
.login-title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
.login-sub { font-size: 15px; color: var(--text2); margin-bottom: 40px; }

.btn-google {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: #fff;
  color: #1f1f1f;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: opacity .15s, transform .1s;
}
.btn-google:hover { opacity: .92; }
.btn-google:active { transform: scale(.97); }
.btn-google:disabled { opacity: .6; cursor: default; }
</style>
