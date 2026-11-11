import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { listNotifications, markAllAsRead, markAsRead } from '../../services/notificationService'

const TYPE_DOT = {
  success: 'bg-green-600',
  warning: 'bg-orange-500',
  reminder: 'bg-blue-500',
  info: 'bg-gray-500',
}

function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const refresh = () => listNotifications(user.id).then(setNotifications).catch(() => {})
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    // Notifications are created by database triggers while the user is logged in,
    // so poll and refresh when the tab regains focus.
    const timer = setInterval(onVisible, 30000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function handleClick(notification) {
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
      )
    }
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  async function handleMarkAll() {
    try {
      await markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch { /* keep the list as is; the notifications page shows errors */ }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-lg p-1.5 hover:bg-green-50 ${open ? 'text-green-700' : 'text-gray-600'}`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={open ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[1000]" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed inset-x-3 top-[84px] z-[1001] overflow-hidden rounded-2xl border border-gray-100 bg-white text-gray-800 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkAll} className="rounded-md px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                {notifications.slice(0, 8).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 ${n.is_read ? '' : 'bg-green-50/50'}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-gray-200' : TYPE_DOT[n.type] ?? TYPE_DOT.info}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${n.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>{n.title}</span>
                        {n.message && <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">{n.message}</span>}
                        <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.created_at)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-gray-100 bg-gray-50 px-4 py-3 text-center text-sm font-medium text-green-700 hover:bg-green-50">
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
