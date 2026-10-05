import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FieldNotes } from '../../components/fields/FieldNotes'
import { FieldReportsLGU } from '../../components/fields/FieldReportsLGU'
import { MapView } from '../../components/maps/MapView'
import { MediaGallery } from '../../components/media/MediaGallery'
import { MediaUpload } from '../../components/media/MediaUpload'
import { useAuth } from '../../hooks/useAuth'
import { FIELD_STATUS_LABELS, SEED_TYPES } from '../../lib/constants'
import { listCyclesForField } from '../../services/cropService'
import { approveField, getField } from '../../services/fieldService'
import { listMediaForField } from '../../services/mediaService'
import { createNotification } from '../../services/notificationService'

export function LGUFieldView() {
  const { fieldId } = useParams()
  const { user, profile } = useAuth()

  const [field, setField] = useState(null)
  const [media, setMedia] = useState([])
  const [cycles, setCycles] = useState([])
  const [error, setError] = useState(null)
  const [approving, setApproving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    getField(fieldId).then(setField).catch((err) => setError(err.message))
    listMediaForField(fieldId).then(setMedia).catch((err) => setError(err.message))
    listCyclesForField(fieldId).then(setCycles).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      setField(await getField(fieldId))
    } catch (err) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleApprove() {
    setApproving(true)
    setError(null)
    try {
      const updated = await approveField({ fieldId, approvedBy: user.id, reviewedUpdatedAt: field.updated_at })
      setField(updated)
      await createNotification({
        userId: updated.farmer_id,
        title: 'Field approved',
        message: `Your field "${updated.field_name}" was approved by LGU staff. Its data is now included in Community.`,
        type: 'success',
        link: `/fields/${updated.id}`,
      }).catch(() => setError('Field approved, but the farmer notification could not be sent.'))
    } catch (err) {
      setError(err.message)
    } finally {
      setApproving(false)
    }
  }

  if (!field) {
    return <div className="p-8 text-center text-gray-500">{error ?? 'Loading...'}</div>
  }

  return (
    <div className="page-container detail-page">
      <Link to="/" className="text-sm text-green-700 hover:underline">
        &larr; Back to All Fields
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-green-800">{field.field_name}</h1>
          <p className="text-sm text-gray-600">
            {field.purok ?? '—'} · Crop status: {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}
            {field.area_hectares != null && ` · ${field.area_hectares} ha`}
          </p>
        </div>
        {field.is_verified ? (
          <span className="rounded bg-green-100 px-3 py-1 text-sm text-green-800">Approved by LGU</span>
        ) : (
          <span className="rounded bg-amber-100 px-3 py-1 text-sm text-amber-800">Pending LGU approval</span>
        )}
      </div>

      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Submitted Field Information</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {[
            ['Owner name', field.owner_name],
            ['Maintainer name', field.maintainer_name],
            ['Area (hectares)', field.area_hectares],
            ['Purok', field.purok],
            ['Date planted', field.planting_date],
            ['Estimated harvest', field.expected_harvest],
            ['Inbred / Hybrid', SEED_TYPES.find((type) => type.value === field.seed_type)?.label],
            ['Crop status', FIELD_STATUS_LABELS[field.field_status] ?? field.field_status],
            ['Crop variety', field.crop_variety],
            ['Soil type', field.soil_type],
            ['Irrigation type', field.irrigation_type],
            ['GPS coordinates', `${field.latitude}, ${field.longitude}`],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-gray-500">{label}</dt>
              <dd className="mt-1 break-words font-medium">{value ?? 'Not provided'}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-gray-600">
          {field.is_verified
            ? 'This field is approved and included in Community. Changes to its information require a new review.'
            : 'Review the submitted information before approving. Pending field data is excluded from Community.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {!field.is_verified && profile?.role === 'lgu_staff' && profile.is_active && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || refreshing}
              className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
            >
              {approving ? 'Approving...' : 'Approve for Community'}
            </button>
          )}
          <button type="button" onClick={handleRefresh} disabled={refreshing || approving} className="rounded border px-3 py-2 text-sm disabled:opacity-50">
            {refreshing ? 'Refreshing...' : 'Refresh Details'}
          </button>
        </div>
      </section>

      <div className="mt-4">
        <MapView fields={[field]} boundaryPoints={field.polygon_coords ?? []} />
      </div>

      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Crop Cycles</h2>
        {cycles.length === 0 && <p className="text-sm text-gray-500">No crop cycles recorded.</p>}
        <ul className="flex flex-col gap-1 text-sm">
          {cycles.map((cycle) => (
            <li key={cycle.id}>
              {cycle.season} {cycle.year} — {cycle.status}
              {cycle.crop_variety && ` · ${cycle.crop_variety}`}
              {cycle.yield_kg && ` · ${cycle.yield_kg} kg`}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Photos, 360° &amp; Video</h2>
        <MediaUpload fieldId={fieldId} onUploaded={(m) => setMedia((prev) => [m, ...prev])} />
        <MediaGallery media={media} />
      </section>

      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Notes</h2>
        <FieldNotes fieldId={fieldId} />
      </section>

      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Monitoring Reports</h2>
        <FieldReportsLGU fieldId={fieldId} />
      </section>
    </div>
  )
}
