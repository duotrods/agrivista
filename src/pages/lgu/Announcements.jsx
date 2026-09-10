import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/common/Select'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PUROKS } from '../../lib/constants'
import { createAnnouncement, listAnnouncements } from '../../services/announcementService'

export function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetPurok, setTargetPurok] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    listAnnouncements().then(setAnnouncements).catch((err) => setError(err.message))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setError(null)
    setLastResult(null)
    try {
      const { announcement, recipientCount } = await createAnnouncement({
        title,
        message,
        targetPurok,
        createdBy: user.id,
      })
      setAnnouncements((prev) => [{ ...announcement, author: { full_name: 'You' } }, ...prev])
      setLastResult(`Sent to ${recipientCount} farmer${recipientCount === 1 ? '' : 's'}.`)
      setTitle('')
      setMessage('')
      setTargetPurok('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Announcements" description="Broadcast a notification to farmers in your community." />

      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 rounded border p-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded border px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="rounded border px-3 py-2 text-sm"
        />
        <Select
          aria-label="Target purok"
          value={targetPurok}
          onChange={(e) => setTargetPurok(e.target.value)}
          className="w-fit rounded border px-3 py-2 text-sm"
        >
          <option value="">All puroks</option>
          {PUROKS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          disabled={sending}
          className="w-fit rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Announcement'}
        </button>
        {lastResult && <p className="text-sm text-green-700">{lastResult}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <ul className="flex flex-col gap-2">
        {announcements.length === 0 && <li className="text-sm text-gray-500">No announcements sent yet.</li>}
        {announcements.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{a.title}</p>
            <p className="text-gray-700">{a.message}</p>
            <p className="mt-1 text-xs text-gray-500">
              {a.target_purok ?? 'All puroks'} · {new Date(a.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
