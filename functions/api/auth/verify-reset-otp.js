import { createClient } from '@supabase/supabase-js'
import { json } from '../_lib/http.js'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const otp = String(body.otp || '').trim()
  const newPassword = String(body.newPassword || '')

  if (!email || !otp) {
    return json({ error: 'Email and OTP code are required.' }, 400)
  }
  if (!newPassword || newPassword.length < 8) {
    return json({ error: 'New password must be at least 8 characters long.' }, 400)
  }

  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const hashed = await sha256(otp + ':' + email)
  const now = new Date().toISOString()

  // 1. Check password_resets table
  let valid = false
  let resetRecordId = null

  const { data: records } = await sb
    .from('password_resets')
    .select('id, expires_at, used')
    .eq('email', email)
    .eq('otp_hash', hashed)
    .eq('used', false)
    .gte('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)

  if (records && records.length > 0) {
    valid = true
    resetRecordId = records[0].id
  } else {
    // Check fallback on shop table
    const { data: shops } = await sb
      .from('shops')
      .select('id, reset_otp_hash, reset_otp_expires_at')
      .or(`email_normalized.eq.${email},email.eq.${email}`)
      .limit(1)

    const s = shops && shops[0]
    if (s && s.reset_otp_hash === hashed && s.reset_otp_expires_at && s.reset_otp_expires_at >= now) {
      valid = true
      await sb.from('shops').update({ reset_otp_hash: null, reset_otp_expires_at: null }).eq('id', s.id)
    }
  }

  if (!valid) {
    return json({ error: 'Invalid or expired OTP code. Please request a new one.' }, 400)
  }

  // 2. Find Auth user ID
  // Look up user by email in auth
  const { data: userList, error: listErr } = await sb.auth.admin.listUsers()
  if (listErr) {
    console.error('listUsers error:', listErr)
    return json({ error: 'Failed to find account.' }, 500)
  }

  const targetUser = userList?.users?.find(u => u.email?.toLowerCase() === email)
  if (!targetUser) {
    return json({ error: 'No account found with this email.' }, 404)
  }

  // 3. Update user password
  const { error: updateErr } = await sb.auth.admin.updateUserById(targetUser.id, {
    password: newPassword,
  })

  if (updateErr) {
    console.error('Password update error:', updateErr)
    return json({ error: 'Could not update password: ' + updateErr.message }, 500)
  }

  // 4. Mark reset record as used
  if (resetRecordId) {
    await sb.from('password_resets').update({ used: true }).eq('id', resetRecordId)
  }

  return json({ ok: true, message: 'Password has been successfully updated.' })
}
