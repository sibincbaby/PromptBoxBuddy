import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, signInWithGoogle, logOut, getIdToken } from '@/services/firebaseService'
import { onAuthStateChanged } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const idToken = ref(null)
  const refreshToken = ref(null)
  
  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const userProfile = computed(() => user.value ? {
    uid: user.value.uid,
    email: user.value.email,
    displayName: user.value.displayName,
    photoURL: user.value.photoURL
  } : null)
  
  // Initialize auth - checks if user is already logged in
  function init() {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      loading.value = true
      try {
        if (authUser) {
          user.value = authUser
          idToken.value = await getIdToken()
          refreshToken.value = authUser.refreshToken
        } else {
          user.value = null
          idToken.value = null
          refreshToken.value = null
        }
      } catch (err) {
        console.error('Auth state change error:', err)
        error.value = err.message
      } finally {
        loading.value = false
      }
    })
    
    return unsubscribe
  }
  
  // Login with Google
  async function loginWithGoogle() {
    try {
      loading.value = true
      error.value = null
      
      const { user: authUser, idToken: token } = await signInWithGoogle()
      user.value = authUser
      idToken.value = token
      refreshToken.value = authUser.refreshToken
      
      return authUser
    } catch (err) {
      console.error('Google login error:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Logout
  async function logout() {
    try {
      loading.value = true
      await logOut()
      user.value = null
      idToken.value = null
      refreshToken.value = null
    } catch (err) {
      console.error('Logout error:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Refresh the ID token
  async function refreshIdToken() {
    try {
      const token = await getIdToken(true) // Force refresh
      idToken.value = token
      return token
    } catch (err) {
      console.error('Token refresh error:', err)
      error.value = err.message
      throw err
    }
  }
  
  return {
    // State
    user,
    loading,
    error,
    idToken,
    refreshToken,
    
    // Computed
    isAuthenticated,
    userProfile,
    
    // Actions
    init,
    loginWithGoogle,
    logout,
    refreshIdToken
  }
}, {
  persist: {
    key: 'promptbox-auth',
    storage: localStorage,
    paths: ['idToken', 'refreshToken']
  }
})