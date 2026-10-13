import { AuthShell } from '../../components/layout/AuthShell'
import { PasswordInput } from '../../components/common/PasswordInput'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { updatePassword } from '../../services/authService'

// The emailed recovery link signs the user in temporarily; without that
// session there is nothing to reset.
export function ResetPasswordPage() {
  const { user, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  let body
  if (loading) {
    body = <p className="text-sm text-gray-500">Checking your reset link...</p>
  } else if (done) {
    body = <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">Password updated. Taking you to your account...</p>
  } else if (!user) {
    body = (
      <p className="text-sm text-red-600">
        This reset link is invalid or has expired. <Link to="/forgot-password" className="underline">Request a new one</Link>.
      </p>
    )
  } else {
    body = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="auth-label">New password<PasswordInput
          className="rounded border px-3 py-2"
          placeholder="New password" aria-label="New password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required
        /></label>
        <label className="auth-label">Confirm new password<PasswordInput
          className="rounded border px-3 py-2"
          placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required
        /></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="rounded bg-green-700 px-3 py-2 text-white hover:bg-green-600 disabled:opacity-50">
          {submitting ? 'Saving...' : 'Set new password'}
        </button>
      </form>
    )
  }

  return <AuthShell title="Choose a new password" description="Pick a password you have not used before.">{body}</AuthShell>
}
