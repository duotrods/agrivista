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

export function StatsPanel({ fields }) {
  const byBarangay = countBy(fields, (f) => f.barangay)
  const byStatus = countBy(fields, (f) => f.field_status)
  const verifiedCount = fields.filter((f) => f.is_verified).length

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
        <p className="mb-2 text-sm font-medium">Fields by barangay</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byBarangay}>
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
    </div>
  )
}
