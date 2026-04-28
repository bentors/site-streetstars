import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import AuthLoading from '../components/AuthLoading'

export default function Private({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult()
          setIsAdmin(idTokenResult.claims.admin === true)
        } catch (error) {
          console.error('Erro ao verificar token:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <AuthLoading />
  if (!isAdmin) return <Navigate to="/admin" replace />
  return children
}