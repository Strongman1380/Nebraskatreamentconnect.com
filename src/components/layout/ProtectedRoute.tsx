import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../context/AuthContext'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole: UserRole | UserRole[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { role, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />
  }

  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  if (role === 'admin') return <>{children}</>
  if (!allowed.includes(role)) return <Navigate to="/login" replace />

  return <>{children}</>
}
