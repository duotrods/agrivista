import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { listNotifications, markAsRead } from '../../services/notificationService'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    listNotifications(user.id).then(setNotifications).catch(() => {})
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded p-1.5 hover:bg-green-700"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[1000] mt-2 w-72 rounded border bg-white text-gray-800 shadow-lg">
          {notifications.length === 0 && (
            <p className="p-3 text-sm text-gray-500">No notifications yet.</p>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    n.is_read ? 'text-gray-500' : 'font-medium text-gray-900'
                  }`}
                >
                  <p>{n.title}</p>
                  {n.message && <p className="text-xs text-gray-500">{n.message}</p>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
