import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Navbar } from '../../components/layout/Navbar'
import { PageHeader } from '../../components/layout/PageHeader'
import { getPublicFieldStats } from '../../services/publicService'

export function PublicMap() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    getPublicFieldStats().then(setRows).catch((err) => setError(err.message))
  }, [])

  const byPurok = useMemo(() => {
    const totals = {}
    for (const row of rows) {
      totals[row.purok] = (totals[row.purok] ?? 0) + Number(row.field_count)
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [rows])

  const totalFields = byPurok.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="app-shell">
      <Navbar />

      <div className="page-container public-page">
        <PageHeader eyebrow="COMMUNITY INSIGHTS · CAGANGANAN" title="A shared view of our growing community." description="Explore rice farming across the puroks of Barangay Caganganan. Public insights show aggregated data while keeping individual farmer records private." />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mb-6 rounded border bg-white p-4 text-center">
          <p className="text-3xl font-semibold text-green-800">{totalFields}</p>
          <p className="text-sm text-gray-600">Total registered rice fields</p>
        </div>

        <div className="rounded border bg-white p-4">
          <p className="mb-2 text-sm font-medium">Fields by purok</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byPurok}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#39745b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
