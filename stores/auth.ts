import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  function init() {
    const { auth } = useFirebase()
    onAuthStateChanged(auth, (u) => {
      user.value = u
      loading.value = false
    })
  }

  async function login() {
    const { auth } = useFirebase()
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function logout() {
    const { auth } = useFirebase()
    useTimerStore().cleanup()
    await signOut(auth)
  }

  return { user, loading, init, login, logout }
})
