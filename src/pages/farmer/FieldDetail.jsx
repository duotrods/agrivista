import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ARFieldView } from '../../components/ar/ARFieldView'
import { CropCyclesSection } from '../../components/crops/CropCyclesSection'
import { FieldDetailsInputs } from '../../components/fields/FieldDetailsInputs'
import { FieldNotes } from '../../components/fields/FieldNotes'
import { FieldReportsList } from '../../components/fields/FieldReportsList'
import { BoundaryDrawer } from '../../components/maps/BoundaryDrawer'
import { MapView } from '../../components/maps/MapView'
import { MediaGallery } from '../../components/media/MediaGallery'
import { MediaUpload } from '../../components/media/MediaUpload'
import { useAuth } from '../../hooks/useAuth'
import { FIELD_STATUS_LABELS, SEED_TYPES } from '../../lib/constants'
import {
  deleteField,
  getField,
  updateFieldDetails,
} from '../../services/fieldService'
import { listMediaForField } from '../../services/mediaService'

export function FieldDetail() {
  const { fieldId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const wantsEdit = searchParams.get('edit') === '1'
  const [field, setField] = useState(null)
  const [media, setMedia] = useState([])
  const [error, setError] = useState(null)

  const [details, setDetails] = useState(null)
  const [savingDetails, setSavingDetails] = useState(false)


  const [editingBoundary, setEditingBoundary] = useState(false)
  const [showAR, setShowAR] = useState(false)

  function loadField() {
    getField(fieldId)
      .then((f) => {
        setField(f)
        setDetails({
          owner_name: f.owner_name ?? '',
          maintainer_name: f.maintainer_name ?? '',
          area_hectares: f.area_hectares ?? '',
          seed_type: f.seed_type ?? '',
          crop_variety: f.crop_variety ?? '',
          soil_type: f.soil_type ?? '',
          irrigation_type: f.irrigation_type ?? '',
          planting_date: f.planting_date ?? '',
          expected_harvest: f.expected_harvest ?? '',
        })
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadField()
    listMediaForField(fieldId).then(setMedia).catch((err) => setError(err.message))
  }, [fieldId])

  // Coming from the Edit button on My Fields: jump to the editable details form.
  useEffect(() => {
    if (!wantsEdit || !field) return
    const section = document.getElementById('field-details')
    section?.scrollIntoView({ block: 'start' })
    section?.querySelector('input, select, textarea')?.focus({ preventScroll: true })
  }, [wantsEdit, field])

  async function handleSaveDetails(e) {
    e.preventDefault()
    setSavingDetails(true)
    setError(null)
    try {
      const cleaned = Object.fromEntries(
        Object.entries(details).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() || null : value,
        ]),
      )
      if (cleaned.area_hectares !== null) cleaned.area_hectares = Number(cleaned.area_hectares)
      const updated = await updateFieldDetails(fieldId, cleaned, user.id)
      setField(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${field.field_name}"? This cannot be undone.`)) return
    try {
      await deleteField(fieldId, user.id)
      navigate('/fields')
    } catch (err) {
      setError(err.message)
    }
  }

  if (!field) {
    return <div className="p-8 text-center text-gray-500">{error ?? 'Loading...'}</div>
  }

  return (
    <div className="page-container detail-page">
      <Link to="/fields" className="text-sm text-green-700 hover:underline">
        &larr; Back to My Fields
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {showAR && <ARFieldView fields={[field]} linkBase="/fields" onClose={() => setShowAR(false)} />}
      <div className="mt-2">
        <div className="float-right flex gap-2">
          <button type="button" onClick={() => setShowAR(true)} className="tb-btn">View in AR</button>
          {wantsEdit
            ? <Link to={`/fields/${fieldId}`} className="tb-btn">Done editing</Link>
            : <Link to={`/fields/${fieldId}?edit=1`} className="tb-btn is-primary">Edit</Link>}
        </div>
        <h1 className="text-2xl font-semibold text-green-800">{field.field_name}</h1>
        <p className="text-sm text-gray-600">
          Crop status: {FIELD_STATUS_LABELS[field.field_status] ?? field.field_status} · GPS: {field.latitude}, {field.longitude}
          {field.area_hectares != null && ` · ${field.area_hectares} ha`}
        </p>
      </div>

      {(() => {
        const review = field.is_verified
          ? { label: 'Approved by LGU', tone: 'border-green-200 bg-green-50 text-green-800', text: 'Your field is included in Community. Changes to field details, crop status, or boundary need LGU approval again.' }
          : field.review_status === 'rejected'
            ? { label: 'Rejected by LGU', tone: 'border-red-200 bg-red-50 text-red-800', text: 'Update the field information to resubmit it for review.' }
            : field.review_status === 'needs_correction'
              ? { label: 'Needs correction', tone: 'border-orange-200 bg-orange-50 text-orange-800', text: 'Update the field information as noted below. Saving changes resubmits it for review.' }
              : { label: 'Pending LGU approval', tone: 'border-amber-200 bg-amber-50 text-amber-800', text: 'LGU staff will review your field information before its data appears in Community. You can continue updating your field while it is pending.' }
        return (
          <div role="status" className={`mt-4 rounded border p-4 text-sm ${review.tone}`}>
            <p className="font-semibold">{review.label}</p>
            <p className="mt-1">{review.text}</p>
            {!field.is_verified && field.review_note && <p className="mt-2 font-medium">LGU note: {field.review_note}</p>}
          </div>
        )
      })()}

      {/* Details */}
      <section id="field-details" className="mt-6 rounded border p-4">
        <h2 className="mb-3 text-lg font-medium">Field Details</h2>
        {wantsEdit ? (
          <form onSubmit={handleSaveDetails} className="flex flex-col gap-2">
            <FieldDetailsInputs
              details={details}
              requireSchedule={field.field_status !== 'fallow' && field.field_status !== 'land_prep'}
              onChange={(name, value) => setDetails((current) => ({ ...current, [name]: value }))}
            />
            <button
              type="submit"
              disabled={savingDetails}
              className="w-fit rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
            >
              {savingDetails ? 'Saving...' : 'Save Details'}
            </button>
          </form>
        ) : (
          <div className="form-grid">
            {[
              ['Owner name', field.owner_name],
              ['Maintainer name', field.maintainer_name],
              ['Area (hectares)', field.area_hectares],
              ['Inbred / Hybrid', SEED_TYPES.find((t) => t.value === field.seed_type)?.label ?? field.seed_type],
              ['Date planted', field.planting_date],
              ['Estimated harvest', field.expected_harvest],
              ['Crop variety', field.crop_variety],
              ['Soil type', field.soil_type],
              ['Irrigation type', field.irrigation_type],
            ].map(([name, value]) => (
              <div key={name} className="form-field">
                <span>{name}</span>
                <p className="text-sm font-normal text-gray-900">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Boundary */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Field Boundary</h2>
        {!wantsEdit ? (
          field.polygon_coords ? <MapView boundaryPoints={field.polygon_coords} /> : <p className="text-sm text-gray-500">No boundary drawn yet.</p>
        ) : editingBoundary || !field.polygon_coords ? (
          <BoundaryDrawer
            fieldId={fieldId}
            initialPoints={field.polygon_coords ?? []}
            onSaved={(updated) => {
              setField(updated)
              setDetails((current) => ({ ...current, area_hectares: updated.area_hectares ?? '' }))
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
        <CropCyclesSection fieldId={fieldId} readOnly={!wantsEdit} />
      </section>

      {/* Media */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Photos, 360° &amp; Video</h2>
        {wantsEdit && <MediaUpload fieldId={fieldId} onUploaded={(m) => setMedia((prev) => [m, ...prev])} />}
        <MediaGallery media={media} />
      </section>

      {/* Notes */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Notes</h2>
        <FieldNotes fieldId={fieldId} readOnly={!wantsEdit} />
      </section>

      {/* Monitoring Reports (read-only; reports are sent from the Monitoring page) */}
      <section className="mt-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Monitoring Reports</h2>
        <FieldReportsList fieldId={fieldId} />
      </section>

      {wantsEdit && (
        <button
          type="button"
          onClick={handleDelete}
          className="mt-6 rounded border border-red-600 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Delete Field
        </button>
      )}
    </div>
  )
}
