import { useEffect, useRef, useState } from 'react'
import { EXPORTERS } from '../../lib/exportDocument'
import { ToolbarIcon } from '../dashboard/ToolbarIcon'

const FORMATS = {
  pdf: ['PDF document', '.pdf'],
  docx: ['Word document', '.docx'],
  csv: ['CSV spreadsheet', '.csv'],
}

/** Export button with a PDF / Word (/ CSV) menu. `getDocument` builds the content when a format is picked. */
export function ExportMenu({ getDocument, formats = ['pdf', 'docx'], disabled = false }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function run(format) {
    setOpen(false)
    setError(null)
    setBusy(format)
    try {
      await EXPORTERS[format](getDocument())
    } catch (err) {
      setError(err.message || 'Could not create the file.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} disabled={disabled || Boolean(busy)} aria-haspopup="menu" aria-expanded={open} className="tb-btn">
        <ToolbarIcon name="download" />{busy ? 'Preparing...' : 'Export'}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-[1001] mt-2 w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
          {formats.map((format) => (
            <button key={format} type="button" role="menuitem" onClick={() => run(format)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
              {FORMATS[format][0]}<span className="text-xs text-gray-400">{FORMATS[format][1]}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="absolute right-0 top-full mt-2 w-60 text-xs text-red-600">{error}</p>}
    </div>
  )
}
