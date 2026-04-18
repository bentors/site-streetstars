import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { auth, db } from '../services/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        try {
          const profileRef = doc(db, 'users', firebaseUser.uid)
          const profileSnap = await getDoc(profileRef)
          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data())
          }
        } catch (error) {
          console.error('Erro ao carregar perfil:', error)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
  }

  const refreshProfile = async () => {
    if (!user) return
    try {
      const profileRef = doc(db, 'users', user.uid)
      const profileSnap = await getDoc(profileRef)
      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data())
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
    }
  }

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    logout,
    refreshProfile,
    isAuthenticated: !!user
  }), [user, userProfile, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}