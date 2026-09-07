import { FarmerDashboard } from '../../pages/farmer/FarmerDashboard'
import { LGUDashboard } from '../../pages/lgu/LGUDashboard'
import { useAuth } from '../../hooks/useAuth'

export function HomeRoute() {
  const { profile } = useAuth()

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading...</div>
  if (profile.role === 'lgu_staff') return <LGUDashboard />
  return <FarmerDashboard />
}
