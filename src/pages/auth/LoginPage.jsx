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
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-semibold text-green-800">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          className="rounded border px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="rounded border px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
    </div>
  )
}
