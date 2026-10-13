import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/authService'
import { NotificationBell } from './NotificationBell'

const NAV_LINKS = {
  farmer: [['/', 'Dashboard'], ['/fields', 'My Fields'], ['/my-map', 'Map'], ['/monitoring', 'Monitoring'], ['/reports', 'Reports'], ['/notifications', 'Notifications'], ['/profile', 'Profile']],
  lgu_staff: [['/', 'Dashboard'], ['/lgu/fields', 'Rice Fields'], ['/lgu/map', 'Map'], ['/lgu/verify', 'Verify Fields'], ['/lgu/users', 'Farmers'], ['/lgu/reports', 'Monitoring Reports'], ['/lgu/crop-monitoring', 'Crop Monitoring'], ['/lgu/agricultural-reports', 'Agricultural Reports'], ['/notifications', 'Notifications'], ['/lgu/activity', 'Activity Logs'], ['/profile', 'Profile']],
  admin: [['/', 'Dashboard'], ['/notifications', 'Notifications'], ['/profile', 'Profile']],
}

export function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  async function handleLogout() { await signOut(); navigate('/login') }
  return (
    <nav className="topbar print:hidden" aria-label="Main navigation">
      <Link to="/" className="brand"><img src={logo} alt="" /><span>AgriVista<span className="brand-caption">GROWING TOGETHER</span></span></Link>
      {user ? <>
        <div className="nav-links">{(NAV_LINKS[profile?.role] ?? NAV_LINKS.farmer).map(([to, text]) => <NavLink key={to} to={to} end={to === '/'}>{text}</NavLink>)}</div>
        <div className="account-menu"><NotificationBell /><span className="avatar" aria-hidden="true">{(profile?.full_name ?? user.email ?? 'A').slice(0, 1).toUpperCase()}</span><span className="account-name">{profile?.full_name ?? user.email}</span><button type="button" onClick={handleLogout} className="logout-button">Log out</button></div>
      </> : <div className="nav-links"><NavLink to="/" end>Home</NavLink><NavLink to="/map">Rice field map</NavLink><NavLink to="/statistics">Statistics</NavLink><NavLink to="/crop-status">Crop status</NavLink><NavLink to="/about">About</NavLink><NavLink to="/login">Log in</NavLink><NavLink to="/register">Get started ↗</NavLink></div>}
    </nav>
  )
}
