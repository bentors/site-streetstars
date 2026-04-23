import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function Private({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Verifica a custom claim do JWT — não pode ser alterada pelo cliente
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-widest">
          Verificando acesso...
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}