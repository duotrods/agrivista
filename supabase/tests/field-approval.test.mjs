import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

// Run the real migrations in an isolated PostgreSQL instance, with just the
// Supabase-owned auth/storage schemas supplied by this fixture.
test('LGU approval controls Community visibility', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } })
  t.after(() => db.close())
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema storage;
    create table auth.users (
      id uuid primary key,
      email text unique,
      raw_user_meta_data jsonb default '{}',
      email_confirmed_at timestamptz
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create table storage.buckets (id text primary key, name text, public boolean);
    create table storage.objects (id uuid primary key, bucket_id text, name text);
    create function storage.foldername(text) returns text[] language sql as $$
      select string_to_array($1, '/');
    $$;
    grant usage on schema public, auth, storage to anon, authenticated;
  `)
  const migrations = new URL('../migrations/', import.meta.url)
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'))
  }
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select on all tables in schema public to anon;
  `)

  const farmer = '11111111-1111-4111-8111-111111111111'
  const otherFarmer = '22222222-2222-4222-8222-222222222222'
  const staff = '33333333-3333-4333-8333-333333333333'
  const inactiveStaff = '44444444-4444-4444-8444-444444444444'
  for (const id of [farmer, otherFarmer, staff, inactiveStaff]) {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${id}@example.invalid`])
  }
  await db.query("update profiles set role = 'lgu_staff' where id in ($1, $2)", [staff, inactiveStaff])
  await db.query('update profiles set is_active = false where id = $1', [inactiveStaff])

  async function asUser(id, role = 'authenticated') {
    assert.ok(['authenticated', 'anon'].includes(role))
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? ''])
    await db.exec(`set role ${role}`)
  }
  async function communityCount() {
    const { rows } = await db.query('select coalesce(sum(field_count), 0)::integer as total from get_public_field_stats()')
    return rows[0].total
  }
  let field
  async function getField() {
    return (await db.query('select * from rice_fields where id = $1', [field.id])).rows[0]
  }
  async function approve() {
    await asUser(staff)
    return (await db.query('update rice_fields set is_verified = true where id = $1 returning *', [field.id])).rows[0]
  }

  await t.test('new submissions preserve their information and cannot self-approve on insert', async () => {
    await asUser(farmer)
    const result = await db.query(`
      insert into rice_fields (
        farmer_id, field_name, latitude, longitude, purok, owner_name,
        maintainer_name, area_hectares, planting_date, expected_harvest,
        seed_type, crop_variety, soil_type, irrigation_type, field_status,
        is_verified, verified_by, verified_at
      ) values ($1, 'Submitted field', 7.12, 125.45, 'Purok Malinawon', 'Owner',
        'Maintainer', 2.35, '2026-10-06', '2027-01-15', 'hybrid', 'IR64', 'loam',
        'irrigated', 'planted', true, $2, now()) returning *
    `, [farmer, staff])
    field = result.rows[0]
    assert.equal(field.owner_name, 'Owner')
    assert.equal(field.maintainer_name, 'Maintainer')
    assert.equal(Number(field.area_hectares), 2.35)
    assert.equal(field.seed_type, 'hybrid')
    assert.equal(field.is_verified, false)
    assert.equal(field.verified_by, null)
    assert.equal(field.verified_at, null)
    assert.equal(await communityCount(), 0)
  })

  await t.test('farmers and inactive LGU staff cannot approve via direct updates', async () => {
    for (const id of [farmer, inactiveStaff]) {
      await asUser(id)
      await db.query('update rice_fields set is_verified = true, verified_by = $2, verified_at = now() where id = $1', [field.id, staff])
      const current = await getField()
      assert.equal(current.is_verified, false)
      assert.equal(current.verified_by, null)
      assert.equal(await communityCount(), 0)
    }
  })

  await t.test('pending fields are visible to reviewers but not other farmers or anonymous visitors', async () => {
    await asUser(staff)
    assert.ok(await getField())
    await asUser(otherFarmer)
    assert.equal(await getField(), undefined)
    await asUser(null, 'anon')
    assert.equal(await getField(), undefined)
    assert.equal(await communityCount(), 0)
  })

  await t.test('active LGU approval uses server attribution and publishes only aggregate data', async () => {
    await asUser(staff)
    await db.query("update rice_fields set is_verified = true, verified_by = $2, verified_at = '2000-01-01' where id = $1", [field.id, farmer])
    const approved = await getField()
    assert.equal(approved.is_verified, true)
    assert.equal(approved.verified_by, staff)
    assert.ok(new Date(approved.verified_at) > new Date('2000-01-01'))
    await asUser(null, 'anon')
    const { rows } = await db.query('select * from get_public_field_stats()')
    assert.equal(rows.length, 1)
    assert.deepEqual(Object.keys(rows[0]).sort(), ['field_count', 'field_status', 'purok'])
    assert.equal(Number(rows[0].field_count), 1)
    assert.equal(await getField(), undefined)
  })

  await t.test('unchanged saves keep approval and cannot change its attribution or farmer', async () => {
    await asUser(farmer)
    const original = await getField()
    await db.query(`update rice_fields set owner_name = owner_name,
      verified_by = $2, verified_at = now(), farmer_id = $2 where id = $1`, [field.id, otherFarmer])
    const current = await getField()
    assert.equal(current.is_verified, true)
    assert.equal(current.verified_by, staff)
    assert.deepEqual(current.verified_at, original.verified_at)
    assert.equal(current.farmer_id, farmer)
  })

  await t.test('changes to details, crop status, and boundary each remove the field from Community', async () => {
    for (const change of [
      "owner_name = 'Updated owner'",
      "maintainer_name = 'Updated maintainer'",
      'area_hectares = 3.75',
      "planting_date = '2026-10-10'",
      "expected_harvest = '2027-02-01'",
      "seed_type = 'inbred'",
      "crop_variety = 'NSIC Rc222'",
      "soil_type = 'clay'",
      "irrigation_type = 'rainfed'",
      "purok = 'Purok Anahaw'",
      "field_status = 'growing'",
      `polygon_coords = '[{"lat":7.12,"lng":125.45}]'::jsonb`,
    ]) {
      await approve()
      await asUser(farmer)
      await db.query(`update rice_fields set ${change} where id = $1`, [field.id])
      const current = await getField()
      assert.equal(current.is_verified, false, change)
      assert.equal(current.verified_by, null, change)
      assert.equal(current.verified_at, null, change)
      assert.equal(await communityCount(), 0, change)
    }
  })

  await t.test('LGU edits cannot publish changed data in the same request', async () => {
    await approve()
    await db.query("update rice_fields set field_name = 'Edited by staff', is_verified = true where id = $1", [field.id])
    assert.equal((await getField()).is_verified, false)
    assert.equal(await communityCount(), 0)
  })

  await t.test('a stale review cannot approve a newer field version', async () => {
    await asUser(staff)
    const reviewed = (await db.query('select updated_at::text as version from rice_fields where id = $1', [field.id])).rows[0].version
    await asUser(farmer)
    await db.query("update rice_fields set owner_name = 'Changed during review' where id = $1", [field.id])
    await asUser(staff)
    const stale = await db.query(`update rice_fields set is_verified = true
      where id = $1 and updated_at = $2 and is_verified = false returning *`, [field.id, reviewed])
    assert.equal(stale.rows.length, 0)
    assert.equal(await communityCount(), 0)
    assert.equal((await approve()).is_verified, true)
  })

  await t.test('LGU can reject or request correction with a note; farmer edits resubmit', async () => {
    await asUser(farmer)
    await db.query("update rice_fields set owner_name = 'Resubmitted' where id = $1", [field.id])
    await asUser(staff)
    await assert.rejects(
      db.query("update rice_fields set review_status = 'rejected' where id = $1", [field.id]),
      /note is required/,
    )
    await db.query("update rice_fields set review_status = 'needs_correction', review_note = 'Fix area' where id = $1", [field.id])
    let current = await getField()
    assert.equal(current.is_verified, false)
    assert.equal(current.review_status, 'needs_correction')
    assert.equal(current.review_note, 'Fix area')

    // Farmers cannot clear or set the review outcome directly.
    await asUser(farmer)
    await db.query("update rice_fields set review_status = 'pending', review_note = null where id = $1", [field.id])
    current = await getField()
    assert.equal(current.review_status, 'needs_correction')

    // Editing the field resubmits it for review.
    await db.query('update rice_fields set area_hectares = 4.2 where id = $1', [field.id])
    current = await getField()
    assert.equal(current.review_status, 'pending')
    assert.equal(current.review_note, null)

    await asUser(staff)
    await db.query("update rice_fields set review_status = 'rejected', review_note = 'Not a rice field' where id = $1", [field.id])
    assert.equal((await getField()).review_status, 'rejected')
    assert.equal(await communityCount(), 0)

    // Approval clears any previous outcome.
    await asUser(farmer)
    await db.query('update rice_fields set area_hectares = 4.3 where id = $1', [field.id])
    assert.equal((await approve()).review_status, 'pending')
  })

  await t.test('notifications reach LGU staff and farmers for review events', async () => {
    async function titles(userId) {
      await db.exec('reset role')
      return (await db.query('select title from notifications where user_id = $1 order by created_at', [userId])).rows.map((r) => r.title)
    }
    assert.ok((await titles(staff)).includes('New field registration'))
    assert.ok((await titles(staff)).includes('Field pending verification'))
    assert.ok(!(await titles(inactiveStaff)).includes('New field registration'))

    await asUser(farmer)
    await db.query("insert into field_reports (field_id, submitted_by, summary) values ($1, $2, 'Looks good')", [field.id, farmer])
    assert.ok((await titles(staff)).includes('New monitoring report'))

    await asUser(farmer)
    await db.query("update rice_fields set expected_harvest = current_date + 5 where id = $1", [field.id])
    assert.equal((await db.query('select create_harvest_reminders() as n')).rows[0].n, 1)
    assert.equal((await db.query('select create_harvest_reminders() as n')).rows[0].n, 0)
    assert.deepEqual((await titles(farmer)).filter((t) => t === 'Harvest reminder'), ['Harvest reminder'])
    await asUser(null, 'anon')
    await assert.rejects(db.query('select create_harvest_reminders()'), /permission denied/)
    assert.equal((await approve()).is_verified, true)
  })

  await t.test('public map data is anonymised and limited to approved fields', async () => {
    await asUser(null, 'anon')
    const { rows } = await db.query('select * from get_public_fields()')
    assert.equal(rows.length, 1)
    assert.deepEqual(Object.keys(rows[0]).sort(), [
      'area_hectares', 'crop_variety', 'expected_harvest_month', 'field_status',
      'irrigation_type', 'latitude', 'longitude', 'purok', 'seed_type',
    ])
    assert.equal(Number(rows[0].latitude), 7.12)
    await asUser(farmer)
    await db.query("update rice_fields set owner_name = 'Pending again' where id = $1", [field.id])
    await asUser(null, 'anon')
    assert.equal((await db.query('select * from get_public_fields()')).rows.length, 0)
    assert.equal((await approve()).is_verified, true)
  })

  await t.test('approval migration is repeatable and preserves existing approvals', async () => {
    await db.exec('reset role')
    await db.exec(await readFile(new URL('0018_field_approval.sql', migrations), 'utf8'))
    await db.exec(await readFile(new URL('0019_field_review_outcomes.sql', migrations), 'utf8'))
    await db.exec(await readFile(new URL('0020_review_notifications.sql', migrations), 'utf8'))
    await db.exec(await readFile(new URL('0021_public_fields_map.sql', migrations), 'utf8'))
    await asUser(null, 'anon')
    assert.equal(await communityCount(), 1)
  })
})
