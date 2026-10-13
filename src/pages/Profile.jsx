import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PasswordInput } from '../components/common/PasswordInput'
import { Select } from '../components/common/Select'
import { PageHeader } from '../components/layout/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { PUROKS } from '../lib/constants'
import { signOut, updatePassword, updateProfile } from '../services/authService'

const ROLE_LABELS = { farmer: 'Farmer', lgu_staff: 'LGU Staff', admin: 'Admin' }

export function Profile() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [purok, setPurok] = useState(profile?.purok ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  if (!profile) return <div className="p-8 text-center text-gray-500">Loading...</div>

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateProfile(user.id, { fullName: fullName.trim(), purok })
      setMessage('Profile saved. Changes appear everywhere after your next page load.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePassword(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    try {
      await updatePassword(password)
      setPassword('')
      setConfirmPassword('')
      setMessage('Password updated.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="page-container">
      <PageHeader title="Profile" description="Your account settings." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="mb-4 text-sm text-green-700">{message}</p>}
      <section className="mb-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Account</h2>
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{profile.email ?? user.email}</dd></div>
          <div><dt className="text-gray-500">Role</dt><dd className="font-medium">{ROLE_LABELS[profile.role] ?? profile.role}</dd></div>
        </dl>
        <form onSubmit={handleSave} className="flex max-w-md flex-col gap-2">
          <label className="auth-label">Full name<input className="rounded border px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
          <Select aria-label="Purok" value={purok} onChange={(e) => setPurok(e.target.value)} className="rounded border px-3 py-2 text-sm">
            <option value="">Purok (not set)</option>
            {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <button type="submit" disabled={saving} className="w-fit rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </section>
      <section className="mb-6 rounded border p-4">
        <h2 className="mb-2 text-lg font-medium">Change password</h2>
        <form onSubmit={handlePassword} className="flex max-w-md flex-col gap-2">
          <PasswordInput className="rounded border px-3 py-2" placeholder="New password" aria-label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          <PasswordInput className="rounded border px-3 py-2" placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
          <button type="submit" className="w-fit rounded border px-3 py-2 text-sm hover:bg-gray-50">Update password</button>
        </form>
      </section>
      <button type="button" onClick={handleLogout} className="rounded border border-red-600 px-3 py-2 text-sm text-red-700 hover:bg-red-50">Log out</button>
    </div>
  )
}
