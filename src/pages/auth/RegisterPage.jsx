import { Select } from '../../components/common/Select'
import { AuthShell } from '../../components/layout/AuthShell'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BARANGAYS } from '../../lib/constants'
import { signUp } from '../../services/authService'

export function RegisterPage() {
  const [role, setRole] = useState('farmer')
  const [fullName, setFullName] = useState('')
  const [barangay, setBarangay] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signUp({ email, password, fullName, barangay, role })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Let’s grow together" description="Create your account to connect with your farming community.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="farmer"
              checked={role === 'farmer'}
              onChange={() => setRole('farmer')}
            />
            Farmer
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="lgu_staff"
              checked={role === 'lgu_staff'}
              onChange={() => setRole('lgu_staff')}
            />
            LGU Staff
          </label>
        </div>
        {role === 'lgu_staff' && (
          <p className="rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            LGU Staff accounts require approval from an existing LGU staff member before you can
            log in.
          </p>
        )}
        <label className="auth-label">Full name<input
          className="rounded border px-3 py-2"
          placeholder="Full name" aria-label="Full name" autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        /></label>
        <label className="auth-label">Barangay<Select
          aria-label="Barangay"
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
          required
          className="rounded border px-3 py-2"
        >
          <option value="" disabled>
            Select barangay...
          </option>
          {BARANGAYS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select></label>
        <label className="auth-label">Email address<input
          type="email"
          className="rounded border px-3 py-2"
          placeholder="Email" aria-label="Email address" autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /></label>
        <label className="auth-label">Password<input
          type="password"
          className="rounded border px-3 py-2"
          placeholder="Password" aria-label="Password" autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        /></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-green-700 px-3 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-green-700 underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
