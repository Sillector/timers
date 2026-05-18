import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAd4kByPpNDIbkJPxrC88NzMkc_4Ezzqjw',
  authDomain: 'timers-e8124.firebaseapp.com',
  projectId: 'timers-e8124',
  storageBucket: 'timers-e8124.firebasestorage.app',
  messagingSenderId: '874477303190',
  appId: '1:874477303190:web:365c5a9293aeb4260b59b7',
}

let _app: FirebaseApp

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }
  return _app
}

export function useFirebase() {
  const app = getApp()
  return {
    auth: getAuth(app),
    db: getFirestore(app),
  }
}
