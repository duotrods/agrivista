import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../../components/layout/PageHeader'
import { usePublicFields, usePublicStats } from './publicData'

export function StatisticsPage() {
  const { rows, loading, error } = usePublicStats()
  const { rows: fields } = usePublicFields()
  const byPurok = useMemo(() => {
    const totals = {}
    for (const row of rows) totals[row.purok] = (totals[row.purok] ?? 0) + Number(row.field_count)
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [rows])
  const totalFields = byPurok.reduce((sum, r) => sum + r.value, 0)
  const totalHectares = fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0)

  return (
    <div className="page-container public-page">
      <PageHeader eyebrow="GENERAL STATISTICS · CAGANGANAN" title="Rice farming at a glance." description="Only LGU-approved fields contribute to these summaries; individual farmer records stay private." />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded border bg-white p-4 text-center">
          <p className="text-3xl font-semibold text-green-800">{loading || error ? '—' : totalFields}</p>
          <p className="text-sm text-gray-600">LGU-approved rice fields</p>
        </div>
        <div className="rounded border bg-white p-4 text-center">
          <p className="text-3xl font-semibold text-green-800">{loading || error ? '—' : totalHectares.toFixed(1)}</p>
          <p className="text-sm text-gray-600">Hectares of rice land</p>
        </div>
      </div>
      <div className="rounded border bg-white p-4">
        <p className="mb-2 text-sm font-medium">Approved fields by purok</p>
        {!loading && !error && totalFields === 0 && <p className="text-sm text-gray-500">No approved fields yet. Fields will appear here after LGU review.</p>}
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
  )
}
