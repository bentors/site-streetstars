import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function Private({ children }) {
  const [loading, setLoading] = useState(true)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
        }

        try {
          localStorage.setItem("@streetstars_detail", JSON.stringify(userData))
        } catch (error) {
          console.error('Erro ao salvar dados do usuário:', error)
        }

        setSigned(true)
      } else {
        setSigned(false)

        try {
          localStorage.removeItem("@streetstars_detail")
        } catch (error) {
          console.error('Erro ao limpar dados do usuário:', error)
        }
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

  if (!signed) {
    return <Navigate to="/admin" replace />
  }

  return children
}