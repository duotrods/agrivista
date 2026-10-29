import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
export function Layout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuth = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)
  const showSidebar = Boolean(user) && !isAuth
  const content = <>{isAuth ? <Outlet /> : <main id="main-content"><Outlet /></main>}<footer className="site-footer print:hidden"><span>AgriVista</span><span>Connecting fields. Supporting communities.</span><span>Banaybanay, Davao Oriental</span></footer></>
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><Navbar onMenuClick={showSidebar ? () => setMenuOpen((o) => !o) : undefined} />{showSidebar ? <div className="app-body"><Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} /><div className="app-content">{content}</div></div> : content}</div>
}
