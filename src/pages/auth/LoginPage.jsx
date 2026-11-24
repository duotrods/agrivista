import { AuthShell } from '../../components/layout/AuthShell'
import { PasswordInput } from '../../components/common/PasswordInput'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile, signIn, signOut } from '../../services/authService'

export function LoginPage() {
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
      const { user } = await signIn({ email, password })
      // Accounts that are not active yet (LGU staff awaiting approval) or were disabled cannot
      // use the app. Say so here, on the login page, instead of letting the redirect hide it.
      const profile = await getProfile(user.id).catch(() => null)
      if (profile && profile.is_active === false) {
        await signOut().catch(() => {})
        setError(profile.role === 'lgu_staff'
          ? 'Your LGU Staff account is waiting for Admin approval. You can log in once it is approved.'
          : 'Your account has been disabled. Contact the Municipal Agriculture Office for assistance.')
        return
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" description="Your fields, your progress, all in one place.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="auth-label">Email address<input
          type="email"
          className="rounded border px-3 py-2"
          placeholder="Email" aria-label="Email address" autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /></label>
        <label className="auth-label">Password<PasswordInput
          className="rounded border px-3 py-2"
          placeholder="Password" aria-label="Password" autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-green-700 px-3 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link to="/forgot-password" className="text-green-700 underline">Forgot password?</Link>
      </p>
      <p className="mt-2 text-sm">
        No account yet?{' '}
        <Link to="/register" className="text-green-700 underline">
          Register
        </Link>
      </p>
      <p className="mt-2 text-sm">
        <Link to="/map" className="text-gray-500 underline">
          View public field data
        </Link>
      </p>
    </AuthShell>
  )
}
