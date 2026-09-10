import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listReportsForField, submitReport } from '../../services/reportService'

export function FieldReports({ fieldId }) {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listReportsForField(fieldId).then(setReports).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const report = await submitReport({ fieldId, submittedBy: user.id, summary })
      setReports((prev) => [report, ...prev])
      setSummary('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm text-gray-600">
        Submit a summary of this field's condition, crop status, or harvest info for LGU review.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          placeholder="e.g. Field is in growing stage, no pest issues observed, expecting harvest in 3 weeks..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          className="rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-3 flex flex-col gap-2">
        {reports.length === 0 && <li className="text-sm text-gray-500">No reports submitted yet.</li>}
        {reports.map((r) => (
          <li key={r.id} className="rounded bg-gray-50 p-2 text-sm">
            <p>{r.summary}</p>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(r.created_at).toLocaleDateString()} ·{' '}
              <span className={r.status === 'reviewed' ? 'text-green-700' : 'text-amber-700'}>
                {r.status}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
