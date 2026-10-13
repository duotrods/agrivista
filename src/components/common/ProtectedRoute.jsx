import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/authService'

export function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  if (profile && profile.is_active === false) {
    signOut()
    return (
      <div className="p-8 text-center text-red-600">
        {profile.role === 'lgu_staff'
          ? 'Your LGU Staff account is waiting for Admin approval. You can log in once it is approved.'
          : 'Your account has been disabled. Contact the Municipal Agriculture Office for assistance.'}
      </div>
    )
  }

  return children
}
