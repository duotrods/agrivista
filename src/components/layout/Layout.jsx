import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
export function Layout() {
  const { pathname } = useLocation()
  const isAuth = ['/login', '/register'].includes(pathname)
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><Navbar />{isAuth ? <Outlet /> : <main id="main-content"><Outlet /></main>}<footer className="site-footer print:hidden"><span>AgriVista</span><span>Connecting fields. Supporting communities.</span><span>Banaybanay, Davao Oriental</span></footer></div>
}
