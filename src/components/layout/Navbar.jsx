import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/authService'
import { NotificationBell } from './NotificationBell'

export function Navbar({ onMenuClick }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  async function handleLogout() { await signOut(); navigate('/login') }
  return (
    <nav className="topbar print:hidden" aria-label="Main navigation">
      {user && onMenuClick && <button type="button" className="menu-button" onClick={onMenuClick} aria-label="Open menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>}
      <Link to="/" className="brand"><img src={logo} alt="" /><span>AgriVista<span className="brand-caption">GROWING TOGETHER</span></span></Link>
      {user ? <>
        <div className="account-menu"><NotificationBell /><span className="avatar" aria-hidden="true">{(profile?.full_name ?? user.email ?? 'A').slice(0, 1).toUpperCase()}</span><span className="account-name">{profile?.full_name ?? user.email}</span><button type="button" onClick={handleLogout} className="logout-button">Log out</button></div>
      </> : <div className="nav-links"><NavLink to="/" end>Home</NavLink><NavLink to="/map">Rice field map</NavLink><NavLink to="/statistics">Statistics</NavLink><NavLink to="/crop-status">Crop status</NavLink><NavLink to="/about">About</NavLink><NavLink to="/login">Log in</NavLink><NavLink to="/register">Get started ↗</NavLink></div>}
    </nav>
  )
}
