import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { createNote, listNotesForField } from '../../services/noteService'

export function FieldNotes({ fieldId }) {
  const { user, profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listNotesForField(fieldId).then(setNotes).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const note = await createNote({ fieldId, authorId: user.id, content, isPrivate })
      setNotes((prev) => [{ ...note, _authorName: profile?.full_name }, ...prev])
      setContent('')
      setIsPrivate(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          placeholder="Add a note or remark..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="rounded border px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private (only visible to you)
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'Posting...' : 'Add Note'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-3 flex flex-col gap-2">
        {notes.length === 0 && <li className="text-sm text-gray-500">No notes yet.</li>}
        {notes.map((note) => (
          <li key={note.id} className="rounded bg-gray-50 p-2 text-sm">
            <p>{note.content}</p>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(note.created_at).toLocaleString()}
              {note.is_private && ' · private'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
