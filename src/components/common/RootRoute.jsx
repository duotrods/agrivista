import { useAuth } from '../../hooks/useAuth'
import { PublicHome } from '../../pages/public/PublicHome'
import { HomeRoute } from './HomeRoute'
import { ProtectedRoute } from './ProtectedRoute'

// Visitors see the public landing page; signed-in users get their dashboard.
export function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (!user) return <PublicHome />
  return <ProtectedRoute><HomeRoute /></ProtectedRoute>
}
