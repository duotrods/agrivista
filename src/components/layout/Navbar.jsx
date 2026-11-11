import { Link, NavLink } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../hooks/useAuth'
import { NotificationBell } from './NotificationBell'
import { ProfileMenu } from './ProfileMenu'

export function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  if (user) {
    return (
      <nav className="topbar topbar-app print:hidden" aria-label="Main navigation">
        <div className="topbar-left">
          {onMenuClick && <button type="button" className="menu-button" onClick={onMenuClick} aria-label="Open menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>}
          <Link to="/" className="topbar-logo" aria-label="AgriVista home"><img src={logo} alt="" /></Link>
        </div>
        <div className="account-menu"><NotificationBell /><span className="topbar-divider" aria-hidden="true" /><ProfileMenu /></div>
      </nav>
    )
  }
  return (
    <nav className="topbar print:hidden" aria-label="Main navigation">
      <Link to="/" className="brand"><img src={logo} alt="" /><span>AgriVista<span className="brand-caption">GROWING TOGETHER</span></span></Link>
      <div className="nav-links"><NavLink to="/" end>Home</NavLink><NavLink to="/map">Rice field map</NavLink><NavLink to="/statistics">Statistics</NavLink><NavLink to="/crop-status">Crop status</NavLink><NavLink to="/about">About</NavLink><NavLink to="/login">Log in</NavLink><Link to="/register" className="nav-cta">Get started</Link></div>
    </nav>
  )
}
