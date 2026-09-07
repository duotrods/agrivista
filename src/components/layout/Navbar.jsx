import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/authService'
import { NotificationBell } from './NotificationBell'

export function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  async function handleLogout() { await signOut(); navigate('/login') }
  return (
    <nav className="topbar print:hidden" aria-label="Main navigation">
      <Link to="/" className="brand"><img src={logo} alt="" /><span>AgriVista<span className="brand-caption">GROWING TOGETHER</span></span></Link>
      {user ? <>
        <div className="nav-links">
          <NavLink to="/" end>{profile?.role === 'lgu_staff' ? 'Overview' : 'My fields'}</NavLink>
          {profile?.role === 'lgu_staff' ? <><NavLink to="/lgu/users">People</NavLink><NavLink to="/lgu/activity">Activity</NavLink><NavLink to="/lgu/settings">Settings</NavLink></> : <NavLink to="/fields/new">Add field</NavLink>}
          <NavLink to="/public">Community</NavLink>
        </div>
        <div className="account-menu"><NotificationBell /><span className="avatar" aria-hidden="true">{(profile?.full_name ?? user.email ?? 'A').slice(0, 1).toUpperCase()}</span><span className="account-name">{profile?.full_name ?? user.email}</span><button type="button" onClick={handleLogout} className="logout-button">Log out</button></div>
      </> : <div className="nav-links"><NavLink to="/public">Community insights</NavLink><NavLink to="/login">Log in</NavLink><NavLink to="/register">Get started ↗</NavLink></div>}
    </nav>
  )
}
