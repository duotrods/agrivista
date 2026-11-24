import { useState } from 'react'
import { PasswordInput } from '../components/common/PasswordInput'
import { Select } from '../components/common/Select'
import { LogoutDialog } from '../components/layout/LogoutDialog'
import { PageHeader } from '../components/layout/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { PUROKS } from '../lib/constants'
import { updatePassword, updateProfile } from '../services/authService'

const ROLE_LABELS = { farmer: 'Farmer', lgu_staff: 'LGU Staff', admin: 'Admin' }

// The form only mounts once the profile has loaded, so it starts with the real name and purok
// (starting from empty values would let a save blank the name after a page refresh).
export function Profile() {
  const { user, profile } = useAuth()
  if (!profile) return <div className="page-container"><p className="dash-empty">Loading...</p></div>
  return <ProfileForm key={profile.id} user={user} profile={profile} />
}

function ProfileForm({ user, profile }) {
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [purok, setPurok] = useState(profile.purok ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

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

  return (
    <div className="page-container">
      <PageHeader title="Profile" description="Your account settings." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="dash-note is-success">{message}</p>}

      <section className="dash-card">
        <div className="dash-card-head"><h2>Account</h2><span className={`stat-pill ${profile.role === 'admin' ? 'tone-blue' : profile.role === 'lgu_staff' ? 'tone-amber' : 'tone-green'}`}>{ROLE_LABELS[profile.role] ?? profile.role}</span></div>
        <div className="form-grid">
          <div className="form-field"><span>Email</span><p className="text-sm font-normal text-gray-900">{profile.email ?? user.email}</p></div>
          <div className="form-field"><span>Role</span><p className="text-sm font-normal text-gray-900">{ROLE_LABELS[profile.role] ?? profile.role}</p></div>
        </div>
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-field">
            <label htmlFor="profile-name">Full name <span className="text-red-600">*</span></label>
            <input id="profile-name" className="rounded border px-3 py-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="form-field">
            <span>Purok</span>
            <Select aria-label="Purok" value={purok} onChange={(e) => setPurok(e.target.value)} className="rounded border px-3 py-2 text-sm">
              <option value="">Purok (not set)</option>
              {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <div className="form-span"><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></div>
        </form>
      </section>

      <section className="dash-card mt-4">
        <div className="dash-card-head"><h2>Change password</h2><span>At least 6 characters</span></div>
        <form onSubmit={handlePassword} className="form-grid">
          <div className="form-field">
            <span>New password</span>
            <PasswordInput className="rounded border px-3 py-2" placeholder="New password" aria-label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <div className="form-field">
            <span>Confirm new password</span>
            <PasswordInput className="rounded border px-3 py-2" placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
          </div>
          <div className="form-span"><button type="submit" className="btn-secondary">Update password</button></div>
        </form>
      </section>

      <div className="mt-4"><button type="button" onClick={() => setConfirmingLogout(true)} className="row-btn is-danger" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>Log out</button></div>
      <LogoutDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} />
    </div>
  )
}
