// Gives the signed-in shop owner a 5-minute link token for one of THEIR bills.
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'

import { json } from './_lib/http.js'

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const jwt = (request.headers.get('authorization') || '').replace(/^Bearer /, '')
  const { data: { user } } = await sb.auth.getUser(jwt)
  if (!user) return json({ error: 'Not signed in' }, 401)
  const body = await request.json().catch(() => ({}))
  const id = String(body?.id || '')
  const { data: shop } = await sb.from('shops').select('id').eq('owner_id', user.id).maybeSingle()
  const { data: bill } = await sb.from('bills').select('id,shop_id').eq('id', id).maybeSingle()
  if (!shop || !bill || bill.shop_id !== shop.id) return json({ error: 'Bill not found' }, 404)
  const { data: ok } = await sb.rpc('shop_can_write', { p_shop: shop.id, p_product: 'billing' })
  if (!ok) return json({ error: 'View only' }, 403)
  const exp = Date.now() + 5 * 60e3
  const sig = createHmac('sha256', env.PRINT_SIGNING_SECRET).update(`${id}.${exp}`).digest('hex')
  return json({ token: `${exp}.${sig}` })
}