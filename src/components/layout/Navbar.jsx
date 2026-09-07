import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/authService'
import { NotificationBell } from './NotificationBell'

export function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between bg-green-800 px-4 py-3 text-white print:hidden">
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
        <img src={logo} alt="AgriVista" className="h-8 w-8" />
        AgriVista
      </Link>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <NotificationBell />
          <span>{profile?.full_name ?? user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-green-700 px-3 py-1 hover:bg-green-600"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
