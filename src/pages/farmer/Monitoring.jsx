import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Select } from '../../components/common/Select'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { FIELD_STATUSES, FIELD_STATUS_LABELS } from '../../lib/constants'
import { listFieldsForFarmer, updateFieldStatus } from '../../services/fieldService'

function FieldStatusCard({ field, userId, onUpdated }) {
  const [status, setStatus] = useState(field.field_status)
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateFieldStatus({ fieldId: field.id, changedBy: userId, oldStatus: field.field_status, newStatus: status, remarks: remarks || null })
      setRemarks('')
      onUpdated({ ...field, field_status: status, is_verified: false, review_status: 'pending' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="rounded border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/fields/${field.id}`} className="font-medium text-green-700 hover:underline">{field.field_name}</Link>
        <span className="text-sm text-gray-600">Now: {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Select aria-label={`Crop status for ${field.field_name}`} value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
          {FIELD_STATUSES.map((s) => <option key={s} value={s}>{FIELD_STATUS_LABELS[s]}</option>)}
        </Select>
        <input type="text" placeholder="Observation (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="flex-1 rounded border px-3 py-2 text-sm" />
        <button type="submit" disabled={saving || status === field.field_status} className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50">{saving ? 'Updating...' : 'Update'}</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  )
}

export function Monitoring() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) listFieldsForFarmer(user.id).then(setFields).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [user])

  return (
    <div className="page-container">
      <PageHeader title="Monitoring" description="Record how each field is doing: Fallow → Land preparation → Planted → Growing → Harvested." />
      <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Changing a crop status sends the field back to LGU review. Photos, crop cycles and detailed observations are on each field's page.</p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <ul className="flex flex-col gap-3">
        {loading && <li className="text-gray-500">Loading fields...</li>}
        {!loading && fields.length === 0 && <li className="text-sm text-gray-500">No fields yet. <Link to="/fields/new" className="text-green-700 underline">Add one</Link>.</li>}
        {fields.map((f) => (
          <FieldStatusCard key={f.id} field={f} userId={user.id} onUpdated={(updated) => setFields((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))} />
        ))}
      </ul>
    </div>
  )
}
