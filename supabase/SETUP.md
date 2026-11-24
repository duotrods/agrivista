# Moving AgriVista to a new Supabase project

Follow these steps in order. It takes about 15 minutes. Keep the old project untouched until the new one works.

## 1. Create the project
1. In [supabase.com](https://supabase.com) create a new project (Singapore region is closest to Davao).
2. Save the database password somewhere safe (a password manager). Do **not** write it in `.env` or in code.

## 2. Set up the database (one script)
1. Open **SQL Editor -> New query**.
2. Paste the whole contents of [`supabase/setup/full-setup.sql`](setup/full-setup.sql) and press **Run**.
   - Run it **once, on a new empty project**. It is not meant to be re-run (a few policies are created without "drop if exists").
   - If it fails halfway, create a fresh project and run it again instead of patching a half-built one.
3. Open a new query, paste [`supabase/setup/verify.sql`](setup/verify.sql) and run it. **Every row must say `OK`.** If any row says `MISSING`, stop and send me that row.

This script is built from the 25 files in `supabase/migrations/`. After you add a new migration, run `npm run db:bundle` to refresh it (the test suite fails if it is out of date).

## 3. Storage
The script creates the public bucket **`media`** (photos, 360° images, report photos). Check **Storage** in the dashboard: `media` must exist and be **Public**. If it is missing, create it by hand with that exact name and Public turned on.

## 4. Authentication settings
In **Authentication -> URL Configuration**:
- **Site URL**: your live website address (the Vercel URL or your domain).
- **Redirect URLs**: add the same address, and `http://localhost:5173` for local work.

In **Authentication -> Providers -> Email**, set **Confirm email** the same way as your old project (the app works either way; LGU staff and the admin approval screen show whether an email is verified).

## 5. Point the app at the new project
1. **Project Settings -> API**: copy the **Project URL** and the **anon public** key.
2. Local: copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Vercel: **Project -> Settings -> Environment Variables**, set the same two values (Production and Preview), then **redeploy**.
4. Never use the `service_role` key in the app.

## 6. Create the first admin
Admins are never self-registered.
1. Open the live site and register normally as a **Farmer** with the admin's email.
2. In the SQL Editor run (change the email):
   ```sql
   update profiles set role = 'admin', is_active = true where email = 'admin@example.com';
   ```
3. Log out and in again. The admin sees **LGU Approvals** and **Users**.
4. LGU staff then register as **LGU Staff** and wait for the admin to approve them.

## 7. Quick check after the move
- [ ] Register a farmer, add a field (it must appear as "Pending LGU approval").
- [ ] Register LGU staff; log in before approval -> message says it is waiting for approval.
- [ ] Admin approves the LGU staff; they can now log in and see the new field in **Verify Fields**.
- [ ] LGU approves the field; it appears on the public **Rice field map** (rounded location, no names).
- [ ] Farmer sends a monitoring report **with a photo**; LGU sees the photo and validates it.
- [ ] Upload a 360° photo to a field and open it (also on an iPhone).
- [ ] Export a PDF and a Word file from the LGU dashboard.

## What about the old data?
- **Fresh start (recommended while you are still testing):** do nothing. Everyone registers again.
- **Keeping data is harder than it looks.** User accounts live in Supabase Auth (passwords cannot simply be copied), and rows store the *full address* of uploaded files (`file_url`, `photo_url`) that point to the old project, so photos would need copying and the links rewriting. If you need this, tell me and we will plan it first.

## Clean-up
- The old `.env` contained a database password in a comment. Delete that line and **change that password** in the old project, or delete the old project when you are done.
- Delete the old project's API keys from Vercel after the switch.
