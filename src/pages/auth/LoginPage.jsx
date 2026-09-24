import { AuthShell } from '../../components/layout/AuthShell'
import { PasswordInput } from '../../components/common/PasswordInput'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../services/authService'

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
      await signIn({ email, password })
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
        No account yet?{' '}
        <Link to="/register" className="text-green-700 underline">
          Register
        </Link>
      </p>
      <p className="mt-2 text-sm">
        <Link to="/public" className="text-gray-500 underline">
          View public field data
        </Link>
      </p>
    </AuthShell>
  )
}
