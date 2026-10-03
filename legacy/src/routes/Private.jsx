import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLoading from '../components/AuthLoading'

export default function Private({ children }) {
  const { loading, isAdmin } = useAuth()

  if (loading) return <AuthLoading />
  if (!isAdmin) return <Navigate to="/admin" replace />
  return children
}