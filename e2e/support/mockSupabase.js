import { randomUUID } from 'node:crypto'
import { PROFILES, RPC, seed } from './data.js'

const BASE = 'https://mock.supabase.co'
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
const fakeJwt = (sub) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp: 4102444800 })}.signature`

const PRESETS = { farmer: PROFILES.farmer, lgu: PROFILES.lgu, admin: PROFILES.admin }

function matches(row, key, expr) {
  const [op, ...rest] = expr.split('.')
  const value = rest.join('.')
  const actual = row[key]
  if (op === 'eq') return String(actual) === value
  if (op === 'neq') return String(actual) !== value
  if (op === 'is') return value === 'null' ? actual == null : String(actual) === value
  if (op === 'in') return value.replace(/^\(|\)$/g, '').split(',').includes(String(actual))
  return true
}

/**
 * Fakes Supabase for one page: auth, REST tables (in memory), RPCs and storage.
 * Returns the in-memory db and a log of every write so tests can assert on them.
 */
export async function mockSupabase(page, { as = null, overrides = {}, rpc = {} } = {}) {
  const db = { ...seed(), ...overrides }
  const writes = []
  const rpcCalls = []
  const authCalls = []
  const rpcData = { ...RPC, ...rpc }
  const profile = as ? PRESETS[as] : null

  if (profile) {
    const session = {
      access_token: fakeJwt(profile.id), token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
      refresh_token: 'refresh', user: { id: profile.id, aud: 'authenticated', role: 'authenticated', email: profile.email, app_metadata: {}, user_metadata: {}, created_at: profile.created_at },
    }
    await page.addInitScript((value) => localStorage.setItem('sb-mock-auth-token', value), JSON.stringify(session))
  }

  // Map tiles are irrelevant to the tests; answer instantly with a blank pixel.
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
  await page.route(/tile\.openstreetmap\.org|arcgisonline\.com|maptiler|mapbox/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: pixel }))
  await page.route(/\/images\/.*\.jpg$/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: pixel }))

  await page.route(`${BASE}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const wantsObject = (request.headers().accept ?? '').includes('pgrst.object')
    const returnsRow = (request.headers().prefer ?? '').includes('return=representation')

    if (path.startsWith('/auth/v1/')) {
      if (path.endsWith('/logout')) return route.fulfill({ status: 204, body: '' })
      if (path.endsWith('/token')) {
        const body = request.postDataJSON()
        authCalls.push({ path, body })
        const account = db.profiles.find((p) => p.email === body.email)
        if (!account || body.password !== 'secret123') return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', code: 'invalid_credentials', message: 'Invalid login credentials' })
        return json(200, { access_token: fakeJwt(account.id), token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'refresh', user: { id: account.id, aud: 'authenticated', role: 'authenticated', email: account.email, app_metadata: {}, user_metadata: {}, created_at: account.created_at } })
      }
      if (path.endsWith('/signup')) {
        const body = request.postDataJSON()
        authCalls.push({ path, body })
        return json(200, { id: randomUUID(), aud: 'authenticated', role: 'authenticated', email: body.email, identities: [{}], user_metadata: body.data ?? {}, app_metadata: {} })
      }
      if (path.endsWith('/recover')) { authCalls.push({ path, body: request.postDataJSON() }); return json(200, {}) }
      if (path.endsWith('/user') && profile) return json(200, { id: profile.id, email: profile.email, aud: 'authenticated', role: 'authenticated' })
      return json(401, { message: 'not signed in' })
    }
    if (path.startsWith('/storage/v1/')) return json(200, { Key: 'media/mock-file' })

    if (path.startsWith('/rest/v1/rpc/')) {
      const name = path.split('/').pop()
      rpcCalls.push({ name, body: request.postDataJSON?.() })
      return json(200, name in rpcData ? rpcData[name] : [])
    }

    const table = path.replace('/rest/v1/', '')
    if (!(table in db)) return json(404, { message: `unknown table ${table}` })
    const filters = [...url.searchParams.entries()].filter(([key]) => !['select', 'order', 'limit', 'offset', 'columns'].includes(key))
    const pick = () => db[table].filter((row) => filters.every(([key, expr]) => matches(row, key, expr)))
    const reply = (rows) => (wantsObject
      ? (rows.length ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }))
      : json(200, rows))

    if (method === 'GET' || method === 'HEAD') {
      let rows = pick()
      const limit = Number(url.searchParams.get('limit'))
      if (limit) rows = rows.slice(0, limit)
      return reply(rows)
    }
    if (method === 'POST') {
      const body = request.postDataJSON()
      const created = (Array.isArray(body) ? body : [body]).map((row) => ({ id: randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...row }))
      db[table].push(...created)
      writes.push({ method, table, body })
      if (!returnsRow) return route.fulfill({ status: 201, body: '' })
      return wantsObject ? json(201, created[0]) : json(201, created)
    }
    if (method === 'PATCH') {
      const body = request.postDataJSON()
      const rows = pick()
      rows.forEach((row) => Object.assign(row, body, { updated_at: new Date().toISOString() }))
      writes.push({ method, table, body, filters })
      if (!returnsRow) return route.fulfill({ status: 204, body: '' })
      return reply(rows)
    }
    if (method === 'DELETE') {
      const rows = pick()
      db[table] = db[table].filter((row) => !rows.includes(row))
      writes.push({ method, table, filters })
      return route.fulfill({ status: 204, body: '' })
    }
    return json(405, { message: 'unsupported' })
  })

  return { db, writes, rpcCalls, authCalls }
}
