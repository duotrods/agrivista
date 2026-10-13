/** [label, tailwind classes] describing a field's LGU review state. */
export function reviewBadge(field) {
  if (field.is_verified) return ['Approved by LGU', 'bg-green-100 text-green-800']
  if (field.review_status === 'rejected') return ['Rejected', 'bg-red-100 text-red-800']
  if (field.review_status === 'needs_correction') return ['Needs correction', 'bg-orange-100 text-orange-800']
  return ['Pending LGU approval', 'bg-amber-100 text-amber-800']
}
