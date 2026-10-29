import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { NAV_LINKS } from './navLinks'

const ICON_PATHS = {
  home: 'M3 10.5 12 3l9 7.5V21H3z',
  fields: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-5M21 19v-1a4 4 0 0 0-3-3.9',
  report: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  user: 'M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
}

function Icon({ name }) {
  return <svg className="sidebar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON_PATHS[name]} /></svg>
}

const STORAGE_KEY = 'agrivista.sidebarCollapsed'

function readCollapsed() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

export function Sidebar({ mobileOpen, onClose }) {
  const { profile } = useAuth()
  const [collapsed, setCollapsed] = useState(readCollapsed)

  function toggle() {
    setCollapsed((c) => {
      try { localStorage.setItem(STORAGE_KEY, c ? '0' : '1') } catch { /* storage unavailable */ }
      return !c
    })
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop print:hidden" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar print:hidden${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-open' : ''}`}>
        <nav aria-label="Dashboard navigation">
          {(NAV_LINKS[profile?.role] ?? NAV_LINKS.farmer).map(([to, text, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} title={collapsed ? text : undefined} onClick={onClose}>
              <Icon name={icon} />
              <span className="sidebar-label">{text}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-toggle" onClick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg className="sidebar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} /></svg>
          <span className="sidebar-label">Collapse</span>
        </button>
      </aside>
    </>
  )
}
