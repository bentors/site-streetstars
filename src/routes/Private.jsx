import { useState, useEffect } from 'react'
import { auth } from '../services/firebaseConnection'
import { onAuthStateChanged } from 'firebase/auth'
import { Navigate } from 'react-router-dom'

export default function Private({ children }) {
  const [loading, setLoading] = useState(true)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    async function checkLogin() {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          const userData = {
            uid: user.uid,
            email: user.email,
          }
          localStorage.setItem("@streetstars_detail", JSON.stringify(userData))
          setLoading(false)
          setSigned(true)
        } else {
          setLoading(false)
          setSigned(false)
        }
      })
    }

    checkLogin()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!signed) {
    return <Navigate to="/admin" />
  }

  return children
}