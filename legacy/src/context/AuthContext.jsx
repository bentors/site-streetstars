import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { auth, db } from '../services/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        try {
          // Busca claims de admin e perfil em paralelo — um único listener para toda a app
          const [idTokenResult, profileSnap] = await Promise.all([
            firebaseUser.getIdTokenResult(),
            getDoc(doc(db, 'users', firebaseUser.uid)),
          ])

          setIsAdmin(idTokenResult.claims.admin === true)

          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data())
          }
        } catch (error) {
          console.error('Erro ao carregar perfil/claims:', error)
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setUserProfile(null)
        setIsAdmin(false)
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
    isAdmin,
    loading,
    logout,
    refreshProfile,
    isAuthenticated: !!user
  }), [user, userProfile, isAdmin, loading])

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