import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { BUNDLE, buildBundle } from '../setup/build.mjs'

// The one-file setup script for a new Supabase project must stay in sync with the migrations,
// build a complete database from nothing, and pass its own verification script.
test('full-setup.sql is up to date and builds a complete database', async (t) => {
  assert.equal(await readFile(BUNDLE, 'utf8'), await buildBundle(), 'run `npm run db:bundle` to refresh supabase/setup/full-setup.sql')

  const db = new PGlite({ extensions: { pgcrypto } })
  t.after(() => db.close())
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema storage;
    create table auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
    create table storage.buckets (id text primary key, name text, public boolean);
    create table storage.objects (id uuid primary key, bucket_id text, name text);
    create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/'); $$;
    grant usage on schema public, auth, storage to anon, authenticated;
  `)
  await db.exec(await readFile(BUNDLE, 'utf8'))
  const { rows } = await db.query(await readFile(new URL('../setup/verify.sql', import.meta.url), 'utf8'))
  const missing = rows.filter((row) => row.status !== 'OK').map((row) => row.check_name)
  assert.deepEqual(missing, [])
  assert.ok(rows.length >= 45, `expected the full checklist, got ${rows.length} checks`)
})
