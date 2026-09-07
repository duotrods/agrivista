import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import logo from '../../assets/logo.png'
import { getPublicFieldStats } from '../../services/publicService'

export function PublicMap() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    getPublicFieldStats().then(setRows).catch((err) => setError(err.message))
  }, [])

  const byBarangay = useMemo(() => {
    const totals = {}
    for (const row of rows) {
      totals[row.barangay] = (totals[row.barangay] ?? 0) + Number(row.field_count)
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }))
  }, [rows])

  const totalFields = byBarangay.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between bg-green-800 px-4 py-3 text-white">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <img src={logo} alt="AgriVista" className="h-8 w-8" />
          AgriVista
        </Link>
        <Link to="/login" className="text-sm underline">
          Farmer / LGU Log in
        </Link>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-semibold text-green-800">Rice Fields in Banaybanay</h1>
        <p className="mb-6 text-sm text-gray-600">
          Aggregated public data. Individual farmer records are not shown.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mb-6 rounded border bg-white p-4 text-center">
          <p className="text-3xl font-semibold text-green-800">{totalFields}</p>
          <p className="text-sm text-gray-600">Total registered rice fields</p>
        </div>

        <div className="rounded border bg-white p-4">
          <p className="mb-2 text-sm font-medium">Fields by barangay</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byBarangay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#1B5E20" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
