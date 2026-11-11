import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../services/authService'
import { ConfirmDialog } from '../common/ConfirmDialog'

/** Asks before signing out, then signs out and returns to the login page. */
export function LogoutDialog({ open, onClose }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await signOut()
      onClose()
      navigate('/login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      danger
      busy={busy}
      title="Log out?"
      message="You will need to sign in again to access your account."
      confirmLabel="Log out"
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
