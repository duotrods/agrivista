import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'

const FEATURES = [
  ['Field registration', 'Farmers register rice fields with location, boundary, area and variety. The LGU reviews each field before it is counted.'],
  ['Crop monitoring', 'Farmers keep crop status, observations and monitoring reports up to date through the season.'],
  ['Maps, photos and 360° views', 'Fields can be explored on a map, with photos, 360° images and a simple AR view of field information.'],
  ['Agricultural reports', 'LGU staff get summaries of fields, crop status, distribution and harvest projections.'],
]

export function AboutPage() {
  return (
    <div className="page-container public-page">
      <PageHeader eyebrow="ABOUT AGRIVISTA" title="A shared view of our rice fields." description="AgriVista is a web app for Barangay Caganganan, Banaybanay, Davao Oriental. It connects rice farmers and the local government unit around one trusted record of the community's fields." />
      <ul className="mb-6 grid gap-3 sm:grid-cols-2">
        {FEATURES.map(([title, text]) => (
          <li key={title} className="rounded border bg-white p-4">
            <h2 className="font-medium">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{text}</p>
          </li>
        ))}
      </ul>
      <p className="mb-4 text-sm text-gray-600">Privacy: public pages only show LGU-approved fields, without names, owners or exact locations.</p>
      <Link to="/register" className="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600">Get started</Link>
    </div>
  )
}
