import { useEffect, useRef } from 'react'

/** Centered confirmation modal. Closes on Esc or a click outside; Cancel is focused first. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, busy = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 p-4" onClick={busy ? undefined : onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'}`}>{busy ? 'Please wait...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
