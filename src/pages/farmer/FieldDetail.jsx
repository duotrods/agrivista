import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CropCyclesSection } from '../../components/crops/CropCyclesSection'
import { FieldNotes } from '../../components/fields/FieldNotes'
import { BoundaryDrawer } from '../../components/maps/BoundaryDrawer'
import { MapView } from '../../components/maps/MapView'
import { MediaGallery } from '../../components/media/MediaGallery'
import { MediaUpload } from '../../components/media/MediaUpload'
import { useAuth } from '../../hooks/useAuth'
import { CROP_VARIETIES, FIELD_STATUSES, IRRIGATION_TYPES, SOIL_TYPES } from '../../lib/constants'
import {
  deleteField,
  getField,
  listStatusLogs,
  updateFieldDetails,
  updateFieldStatus,
} from '../../services/fieldService'
import { listMediaForField } from '../../services/mediaService'

export function FieldDetail() {
  const { fieldId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [field, setField] = useState(null)
  const [media, setMedia] = useState([])
  const [statusLogs, setStatusLogs] = useState([])
  const [error, setError] = useState(null)

  const [details, setDetails] = useState(null)
  const [savingDetails, setSavingDetails] = useState(false)

  const [newStatus, setNewStatus] = useState('')
  const [statusRemarks, setStatusRemarks] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)

  const [editingBoundary, setEditingBoundary] = useState(false)

  function loadField() {
    getField(fieldId)
      .then((f) => {
        setField(f)
        setDetails({
          crop_variety: f.crop_variety ?? '',
          soil_type: f.soil_type ?? '',
          irrigation_type: f.irrigation_type ?? '',
          planting_date: f.planting_date ?? '',
          expected_harvest: f.expected_harvest ?? '',
        })
        setNewStatus(f.field_status)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadField()
    listMediaForField(fieldId).then(setMedia).catch((err) => setError(err.message))
    listStatusLogs(fieldId).then(setStatusLogs).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleSaveDetails(e) {
    e.preventDefault()
    setSavingDetails(true)
    setError(null)
    try {
      const cleaned = Object.fromEntries(
        Object.entries(details).map(([k, v]) => [k, v === '' ? null : v]),
      )
      const updated = await updateFieldDetails(fieldId, cleaned)
      setField(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleStatusChange(e) {
    e.preventDefault()
    setChangingStatus(true)
    setError(null)
    try {
      await updateFieldStatus({
        fieldId,
        changedBy: user.id,
        oldStatus: field.field_status,
        newStatus,
        remarks: statusRemarks || null,
      })
      setStatusRemarks('')
      loadField()
      listStatusLogs(fieldId).then(setStatusLogs)
    } catch (err) {
      setError(err.message)
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${field.field_name}"? This cannot be undone.`)) return
    try {
      await deleteField(fieldId, user.id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (!field) {
    return <div className="p-8 text-center text-gray-500">{error ?? 'Loading...'}</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/" className="text-sm text-green-700 hover:underline">
        &larr; Back to My Fields
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-2">
        <h1 className="text-2xl font-semibold text-green-800">{field.field_name}</h1>
        <p className="text-sm text-gray-600">
          GPS: {field.latitude}, {field.longitude}
          {field.area_hectares && ` · ${field.area_hectares} ha`}
        </p>
      </div>

      {/* Status */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Status</h2>
        <p className="mb-3 text-sm">
          Current: <span className="font-semibold">{field.field_status}</span>
        </p>
        <form onSubmit={handleStatusChange} className="flex flex-col gap-2">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            {FIELD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Remarks (optional)"
            value={statusRemarks}
            onChange={(e) => setStatusRemarks(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={changingStatus || newStatus === field.field_status}
            className="w-fit rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            {changingStatus ? 'Updating...' : 'Update Status'}
          </button>
        </form>

        {statusLogs.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-gray-600">
            {statusLogs.map((log) => (
              <li key={log.id}>
                {new Date(log.created_at).toLocaleDateString()}: {log.old_status ?? '—'} →{' '}
                {log.new_status}
                {log.remarks && ` (${log.remarks})`}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Details */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Field Details</h2>
        <form onSubmit={handleSaveDetails} className="flex flex-col gap-2">
          <select
            value={details.crop_variety}
            onChange={(e) => setDetails((d) => ({ ...d, crop_variety: e.target.value }))}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">Crop variety...</option>
            {CROP_VARIETIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={details.soil_type}
            onChange={(e) => setDetails((d) => ({ ...d, soil_type: e.target.value }))}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">Soil type...</option>
            {SOIL_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={details.irrigation_type}
            onChange={(e) => setDetails((d) => ({ ...d, irrigation_type: e.target.value }))}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">Irrigation type...</option>
            {IRRIGATION_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-600">
            Planting date
            <input
              type="date"
              value={details.planting_date}
              onChange={(e) => setDetails((d) => ({ ...d, planting_date: e.target.value }))}
              className="mt-1 block rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-gray-600">
            Expected harvest
            <input
              type="date"
              value={details.expected_harvest}
              onChange={(e) => setDetails((d) => ({ ...d, expected_harvest: e.target.value }))}
              className="mt-1 block rounded border px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={savingDetails}
            className="w-fit rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            {savingDetails ? 'Saving...' : 'Save Details'}
          </button>
        </form>
      </section>

      {/* Boundary */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Field Boundary</h2>
        {editingBoundary || !field.polygon_coords ? (
          <BoundaryDrawer
            fieldId={fieldId}
            initialPoints={field.polygon_coords ?? []}
            onSaved={(updated) => {
              setField(updated)
              setEditingBoundary(false)
            }}
          />
        ) : (
          <>
            <MapView boundaryPoints={field.polygon_coords} />
            <button
              type="button"
              onClick={() => setEditingBoundary(true)}
              className="mt-2 rounded border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Redraw Boundary
            </button>
          </>
        )}
      </section>

      {/* Crop Cycles */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Crop Cycles</h2>
        <CropCyclesSection fieldId={fieldId} />
      </section>

      {/* Media */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Photos, 360° &amp; Video</h2>
        <MediaUpload fieldId={fieldId} onUploaded={(m) => setMedia((prev) => [m, ...prev])} />
        <MediaGallery media={media} />
      </section>

      {/* Notes */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Notes</h2>
        <FieldNotes fieldId={fieldId} />
      </section>

      <button
        type="button"
        onClick={handleDelete}
        className="mt-6 rounded border border-red-600 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        Delete Field
      </button>
    </div>
  )
}
