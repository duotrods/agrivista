import { useMemo } from 'react'
import { StatCard } from '../../components/dashboard/StatCard'
import { PageHero } from './PageHero'
import { MapView } from '../../components/maps/MapView'
import { PHOTOS, usePublicFields } from './publicData'

export function PublicMapPage() {
  const { rows, loading, error } = usePublicFields()

  const fields = useMemo(
    () => rows.map((r, i) => ({
      id: i,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      field_name: `Rice field · ${r.purok}`,
      field_status: r.field_status,
      purok: r.purok,
      popup_lines: [
        r.area_hectares != null && `Area: ${r.area_hectares} ha`,
        r.crop_variety && `Variety: ${r.crop_variety}`,
      ].filter(Boolean),
    })),
    [rows],
  )
  const hectares = rows.reduce((sum, r) => sum + Number(r.area_hectares ?? 0), 0)
  const puroksShown = new Set(fields.map((f) => f.purok)).size

  return (
    <div className="lp">
      <PageHero chip="RICE FIELD MAP" title="Rice fields across Caganganan." text="LGU-approved fields only. Locations are approximate and no farmer information is shown." photo={PHOTOS.valley} />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="lp-block grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
        <StatCard icon="fields" label="Approved fields" description="LGU-approved fields." value={fields.length} loading={loading} />
        <StatCard icon="area" label="Hectares" description="Combined area." value={hectares.toFixed(1)} loading={loading} />
        <StatCard icon="map" tone="blue" label="Puroks" description="With fields on the map." value={puroksShown} loading={loading} />
      </div>

      <section className="dash-card lp-block">
        <div className="dash-card-head">
          <h2>Approved rice fields</h2>
          <span>{loading ? 'Loading...' : `${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`}</span>
        </div>
        <MapView fields={fields} fieldLinkBase={null} size="large" />
      </section>
    </div>
  )
}
