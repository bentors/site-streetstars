import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLoading from '../components/AuthLoading'

export default function PrivateUser({ children }) {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}