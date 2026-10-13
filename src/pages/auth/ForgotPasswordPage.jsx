import { AuthShell } from '../../components/layout/AuthShell'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../services/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Forgot your password?" description="Enter your email and we will send you a link to choose a new one.">
      {sent ? (
        <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="auth-label">Email address<input
            type="email"
            className="rounded border px-3 py-2"
            placeholder="Email" aria-label="Email address" autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          /></label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded bg-green-700 px-3 py-2 text-white hover:bg-green-600 disabled:opacity-50">
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link to="/login" className="text-green-700 underline">Back to log in</Link></p>
    </AuthShell>
  )
}
