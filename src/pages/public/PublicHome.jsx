import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePublicStats } from './publicData'

export function PublicHome() {
  const { rows, loading } = usePublicStats()
  const total = rows.reduce((sum, r) => sum + Number(r.field_count), 0)
  const puroks = new Set(rows.map((r) => r.purok)).size
  return (
    <div className="page-container public-page">
      <PageHeader eyebrow="BARANGAY CAGANGANAN · BANAYBANAY" title="Growing together, one rice field at a time." description="AgriVista helps farmers register their rice fields and helps the LGU follow crop progress across the barangay." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded border bg-white p-4 text-center">
          <p className="text-3xl font-semibold text-green-800">{loading ? '—' : total}</p>
          <p className="text-sm text-gray-600">LGU-approved rice fields</p>
        </div>
        <div className="rounded border bg-white p-4 text-center">
          <p className="text-3xl font-semibold text-green-800">{loading ? '—' : puroks}</p>
          <p className="text-sm text-gray-600">Puroks with approved fields</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/map" className="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600">Explore the rice field map</Link>
        <Link to="/statistics" className="rounded border px-4 py-2 hover:bg-gray-50">View statistics</Link>
        <Link to="/register" className="rounded border px-4 py-2 hover:bg-gray-50">Register as a farmer</Link>
        <Link to="/login" className="rounded border px-4 py-2 hover:bg-gray-50">Log in</Link>
      </div>
    </div>
  )
}
