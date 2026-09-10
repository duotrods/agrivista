import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_COLORS = {
  fallow: '#9CA3AF',
  land_prep: '#D97706',
  planted: '#65A30D',
  growing: '#16A34A',
  harvested: '#1B5E20',
}

function countBy(items, keyFn) {
  const counts = {}
  for (const item of items) {
    const key = keyFn(item) ?? 'Unknown'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function harvestProjections(fields) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const counts = {}
  for (const field of fields) {
    if (!field.expected_harvest) continue
    const date = new Date(field.expected_harvest)
    if (date < today) continue
    const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    counts[key] = counts[key] ?? { name: key, value: 0, sortKey: date.getFullYear() * 12 + date.getMonth() }
    counts[key].value += 1
  }
  return Object.values(counts).sort((a, b) => a.sortKey - b.sortKey)
}

export function StatsPanel({ fields }) {
  const byPurok = countBy(fields, (f) => f.purok)
  const byStatus = countBy(fields, (f) => f.field_status)
  const verifiedCount = fields.filter((f) => f.is_verified).length
  const upcomingHarvests = harvestProjections(fields)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded border p-4 text-center">
        <p className="text-3xl font-semibold text-green-800">{fields.length}</p>
        <p className="text-sm text-gray-600">Total fields</p>
      </div>
      <div className="rounded border p-4 text-center">
        <p className="text-3xl font-semibold text-green-800">{verifiedCount}</p>
        <p className="text-sm text-gray-600">Verified fields</p>
      </div>
      <div className="rounded border p-4 text-center">
        <p className="text-3xl font-semibold text-green-800">
          {fields.reduce((sum, f) => sum + (f.area_hectares ?? 0), 0).toFixed(1)}
        </p>
        <p className="text-sm text-gray-600">Total hectares</p>
      </div>

      <div className="rounded border p-4 sm:col-span-2">
        <p className="mb-2 text-sm font-medium">Fields by purok</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byPurok}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#1B5E20" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded border p-4">
        <p className="mb-2 text-sm font-medium">Status distribution</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={70} label>
              {byStatus.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#9CA3AF'} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded border p-4 sm:col-span-3">
        <p className="mb-2 text-sm font-medium">Upcoming harvests by month</p>
        {upcomingHarvests.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming harvest dates recorded.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={upcomingHarvests}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#D97706" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
