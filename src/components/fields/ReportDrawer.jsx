import { useState } from 'react'
import { Drawer } from '../common/Drawer'
import { ReportForm } from './ReportForm'

const FORM_ID = 'monitoring-report-form'

/** Monitoring report form in a right-hand panel. Mounted only while open. */
export function ReportDrawer({ fields, initialFieldId, onClose, onSubmitted }) {
  const [busy, setBusy] = useState(false)
  return (
    <Drawer
      title="New monitoring report"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="btn-secondary">Cancel</button>
          <button type="submit" form={FORM_ID} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? 'Submitting...' : 'Submit Report'}</button>
        </>
      }
    >
      <p className="mb-4 text-sm text-gray-600">Tell the LGU how this field is doing. Reports are reviewed and validated by LGU staff.</p>
      <ReportForm formId={FORM_ID} hideSubmit fields={fields} initialFieldId={initialFieldId} onBusyChange={setBusy} onSubmitted={onSubmitted} />
    </Drawer>
  )
}
