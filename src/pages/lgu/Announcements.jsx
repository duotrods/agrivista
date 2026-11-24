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

      <form onSubmit={handleSubmit} className="dash-card mb-4 flex flex-col gap-3">
        <div className="dash-card-head"><h2>New announcement</h2><span>Sent as a notification to farmers</span></div>
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
          className="btn-primary w-fit disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Announcement'}
        </button>
        {lastResult && <p className="text-sm text-green-700">{lastResult}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <section className="dash-card">
        <div className="dash-card-head"><h2>Sent announcements</h2><span>{announcements.length} sent</span></div>
        {announcements.length === 0 && <p className="dash-empty">No announcements sent yet.</p>}
        <ul className="dash-list">
          {announcements.map((a) => (
            <li key={a.id}>
              <p className="dash-list-title">{a.title}</p>
              <p className="mt-1 text-sm text-gray-700">{a.message}</p>
              <p className="dash-list-meta mt-1">{a.target_purok ?? 'All puroks'} · {new Date(a.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
