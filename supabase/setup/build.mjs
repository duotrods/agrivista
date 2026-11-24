// Joins every migration, in order, into one script for a brand-new Supabase project:
//   node supabase/setup/build.mjs        (or: npm run db:bundle)
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const migrations = new URL('../migrations/', import.meta.url)
export const BUNDLE = new URL('./full-setup.sql', import.meta.url)

export async function buildBundle() {
  const files = (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()
  const parts = [
    '-- AgriVista: complete database setup for a NEW, EMPTY Supabase project.',
    '-- Generated from supabase/migrations by supabase/setup/build.mjs. Do not edit by hand.',
    '--',
    '-- Run it once in the Supabase SQL Editor. It is not meant to be re-run on a project that',
    '-- already has the tables (some policies are created without a "drop if exists").',
    `-- Includes ${files.length} migrations: ${files[0]} to ${files.at(-1)}.`,
    '',
  ]
  for (const file of files) {
    parts.push(`-- ============================================================`, `-- ${file}`, `-- ============================================================`, (await readFile(new URL(file, migrations), 'utf8')).trim(), '')
  }
  return parts.join('\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(BUNDLE, await buildBundle())
  console.log('Wrote supabase/setup/full-setup.sql')
}
