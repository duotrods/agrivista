const PATHS = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ar: 'M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10',
  print: 'M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z',
  pin: 'M12 21s-7-6.200-7-11a7 7 0 0 1 14 0c0 4.800-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.300-4.300',
  eye: 'M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  edit: 'M12 20h9M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4L16.500 3.500z',
  plus: 'M12 5v14M5 12h14',
}

export function ToolbarIcon({ name }) {
  return <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>
}
