# AgriVista

A Progressive Web App for rice field identification and monitoring in Banaybanay, Davao Oriental — built as a capstone project. Farmers register and manage their rice fields with GPS coordinates, boundary polygons, and 360° photos; LGU staff oversee and verify fields across the municipality.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, React Router
- **Maps:** Leaflet.js + OpenStreetMap
- **360° Viewer:** Pannellum.js
- **Charts:** Recharts
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security)
- **PWA:** vite-plugin-pwa
- **Hosting:** Vercel

## Features

- **Auth & roles** — email/password signup with Farmer or LGU Staff roles. New LGU Staff accounts require approval from an existing LGU staff member before they can log in.
- **Field management** — register a field with GPS ("Use My Location"), owner and maintainer names, area in hectares, planting and estimated harvest dates, Inbred/Hybrid seed type, and crop status. Edit these details, draw field boundaries with GPS taps or map clicks, and track status history alongside crop/soil/irrigation metadata.
- **Media** — upload photos, 360° panoramas (viewable in-browser), and videos per field.
- **Crop cycles** — track planting seasons, log periodic growth/health observations, record harvest yield.
- **Notes** — comments on a field, optionally private to the author.
- **LGU oversight** — review submitted field information, filter pending approvals, and approve fields for Community. Changes to field details, crop status, or boundaries require approval again. The database prevents self-approval and the review screen rejects outdated records.
- **Notifications** — in-app bell notifies farmers when their field is approved.
- **Admin** — enable/disable user accounts, activity log, system settings.
- **Public view** — `/public` shows aggregated counts of LGU-approved fields by purok, with no login and no individual farmer data exposed. Pending fields are excluded by the database.

## Local Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (Singapore region recommended).

3. **Configure environment variables** — copy `.env.example` to `.env` and fill in your project's URL and anon key (Supabase dashboard → Settings → API):
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

4. **Run the database migrations** — in the Supabase SQL Editor, run every file in `supabase/migrations/` **in numeric order**, from `0001_phase0_schema.sql` through the highest-numbered file. Each one is idempotent (safe to re-run).

5. **Create the storage bucket** — in Supabase Storage, create a bucket named `media` and mark it **Public**. (Migration `0002_storage.sql` also creates it via SQL, but doing it in the UI is more reliable — see that file's policies either way.)

6. **Start the dev server**
   ```
   npm run dev
   ```

7. **Bootstrap your first LGU account** — new LGU Staff signups start disabled pending approval, and there's no LGU staff yet to approve the first one. After registering your first LGU account through the app, manually set that row's `is_active` to `true` in the Supabase Table Editor (`profiles` table). Every LGU account after that can be approved normally from the Users admin page.

## Deployment

For existing installations, apply migrations `0017_farmer_field_details.sql` and
`0018_field_approval.sql` in order before deploying the updated app. New submissions
start pending; previously approved fields remain approved until their information changes.

Run `npm run test:db` to check the approval rules and Community visibility in an
isolated PostgreSQL instance. These checks do not connect to your Supabase project.

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com](https://vercel.com), import the GitHub repository — Vercel auto-detects the Vite build.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in the Vercel project settings.
4. Deploy. Every push to the main branch auto-deploys from then on.

## Project Structure

```
src/
  components/   # Reusable UI: maps, media, crops, layout, common
  pages/        # Routes, grouped by auth/farmer/lgu/public
  hooks/        # useAuth, useGeolocation
  context/      # AuthContext
  lib/          # Supabase client, constants, helpers
  services/     # All Supabase queries, grouped by domain
supabase/
  migrations/   # SQL migrations, run in order
```
