import { PageHeader } from '../../components/layout/PageHeader'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listSettings, updateSetting } from '../../services/adminService'

export function SystemSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState([])
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    listSettings()
      .then((rows) => {
        setSettings(rows)
        setDrafts(Object.fromEntries(rows.map((r) => [r.id, JSON.stringify(r.value)])))
      })
      .catch((err) => setError(err.message))
  }, [])

  async function handleSave(setting) {
    setSavingId(setting.id)
    setError(null)
    try {
      const parsed = JSON.parse(drafts[setting.id])
      const updated = await updateSetting(setting.id, parsed, user.id)
      setSettings((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="System settings" description="Manage the settings that support your workspace." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-3">
        {settings.map((setting) => (
          <div key={setting.id} className="rounded border p-3">
            <p className="font-medium">{setting.key}</p>
            {setting.description && <p className="text-xs text-gray-500">{setting.description}</p>}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={drafts[setting.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [setting.id]: e.target.value }))}
                className="flex-1 rounded border px-2 py-1 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => handleSave(setting)}
                disabled={savingId === setting.id}
                className="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
