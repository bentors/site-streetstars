import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import AuthLoading from '../components/AuthLoading'

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

  if (loading) return <AuthLoading />
  if (!signed) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}