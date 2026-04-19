import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { auth, db } from '../services/firebase'

export default function Private({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminRef = doc(db, 'admins', user.uid)
          const adminSnap = await getDoc(adminRef)

          if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
            localStorage.setItem('@streetstars_detail', JSON.stringify({
              uid: user.uid,
              email: user.email,
            }))
            setIsAdmin(true)
          } else {
            localStorage.removeItem('@streetstars_detail')
            setIsAdmin(false)
          }
        } catch (error) {
          console.error('Erro ao verificar admin:', error)
          setIsAdmin(false)
        }
      } else {
        localStorage.removeItem('@streetstars_detail')
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