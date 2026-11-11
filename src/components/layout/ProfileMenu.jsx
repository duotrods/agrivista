import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogoutDialog } from './LogoutDialog'

const ROLE_LABELS = { farmer: 'Farmer', lgu_staff: 'LGU Staff', admin: 'Admin' }

const ITEM = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50'

function MenuIcon({ path }) {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
}

export function ProfileMenu() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = profile?.full_name ?? user.email
  const role = ROLE_LABELS[profile?.role] ?? 'Account'

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="profile-btn">
        <span className="avatar" aria-hidden="true">{(name ?? 'A').slice(0, 1).toUpperCase()}</span>
        <span className="profile-text">
          <span className="profile-name">{name}</span>
          <span className="profile-role">{role}</span>
        </span>
        <svg className="profile-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-[1001] mt-2 w-60 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="my-1 border-t border-gray-100" />
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} className={ITEM}><MenuIcon path="M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />Profile</Link>
          <Link to="/settings" role="menuitem" onClick={() => setOpen(false)} className={ITEM}><MenuIcon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.100a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.100a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.100a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.100a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z" />Settings</Link>
          <div className="my-1 border-t border-gray-100" />
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setConfirming(true) }} className={`${ITEM} text-red-600 hover:bg-red-50`}><MenuIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />Log out</button>
        </div>
      )}

      <LogoutDialog open={confirming} onClose={() => setConfirming(false)} />
    </div>
  )
}
