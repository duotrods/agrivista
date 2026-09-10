import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FieldNotes } from '../../components/fields/FieldNotes'
import { FieldReportsLGU } from '../../components/fields/FieldReportsLGU'
import { MapView } from '../../components/maps/MapView'
import { MediaGallery } from '../../components/media/MediaGallery'
import { MediaUpload } from '../../components/media/MediaUpload'
import { useAuth } from '../../hooks/useAuth'
import { listCyclesForField } from '../../services/cropService'
import { getField, verifyField } from '../../services/fieldService'
import { listMediaForField } from '../../services/mediaService'
import { createNotification } from '../../services/notificationService'

export function LGUFieldView() {
  const { fieldId } = useParams()
  const { user } = useAuth()

  const [field, setField] = useState(null)
  const [media, setMedia] = useState([])
  const [cycles, setCycles] = useState([])
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    getField(fieldId).then(setField).catch((err) => setError(err.message))
    listMediaForField(fieldId).then(setMedia).catch((err) => setError(err.message))
    listCyclesForField(fieldId).then(setCycles).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleVerify() {
    setVerifying(true)
    setError(null)
    try {
      const updated = await verifyField({ fieldId, verifiedBy: user.id })
      setField(updated)
      await createNotification({
        userId: updated.farmer_id,
        title: 'Field verified',
        message: `Your field "${updated.field_name}" was verified by LGU staff.`,
        type: 'success',
        link: `/fields/${updated.id}`,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
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
            {field.purok ?? '—'} · Status: {field.field_status}
            {field.area_hectares && ` · ${field.area_hectares} ha`}
          </p>
        </div>
        {field.is_verified ? (
          <span className="rounded bg-green-100 px-3 py-1 text-sm text-green-800">Verified</span>
        ) : (
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify Field'}
          </button>
        )}
      </div>

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
