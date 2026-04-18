import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function PrivateUser({ children }) {
  const [loading, setLoading] = useState(true)
  const [signed, setSigned] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSigned(!!user)
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
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}