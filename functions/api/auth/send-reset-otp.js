import { createClient } from '@supabase/supabase-js'
import { sendMail } from '../_lib/gmail.js'
import { json } from '../_lib/http.js'

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }

  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // 1. Verify user exists
  const { data: shops } = await sb.from('shops').select('id, name, owner_name').eq('email_normalized', email).limit(1)
  const shop = shops && shops[0]

  // If not found in shops by email_normalized, check regular email
  let shopRecord = shop
  if (!shopRecord) {
    const { data: fallbackShops } = await sb.from('shops').select('id, name, owner_name').eq('email', email).limit(1)
    shopRecord = fallbackShops && fallbackShops[0]
  }

  const otp = generateOTP()
  const hashed = await sha256(otp + ':' + email)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  // 2. Store OTP in password_resets table (or fallback to shops metadata)
  let insertError = null
  const { error: resetErr } = await sb.from('password_resets').insert({
    email,
    otp_hash: hashed,
    expires_at: expiresAt,
    used: false,
  })

  if (resetErr) {
    insertError = resetErr
    // If table doesn't exist yet, we attempt to save on the shop record if present
    if (shopRecord) {
      await sb.from('shops').update({
        reset_otp_hash: hashed,
        reset_otp_expires_at: expiresAt,
      }).eq('id', shopRecord.id)
    }
  }

  // 3. Send email using existing Gmail API
  const userName = shopRecord?.owner_name || shopRecord?.name || 'Stellar Forge User'
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f1923; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #0f1923; letter-spacing: 0.1em; font-size: 1.25rem;">STELLAR FORGE BILLING</h2>
      </div>
      <p style="font-size: 0.95rem; line-height: 1.5; color: #334155;">Hello <b>${userName}</b>,</p>
      <p style="font-size: 0.95rem; line-height: 1.5; color: #334155;">
        You requested a password reset for your Stellar Forge Billing account. Use the 6-digit OTP code below to reset your password:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 2.2rem; font-weight: 700; letter-spacing: 0.25em; color: #00a88c; background: #f0fdf9; border: 1.5px dashed #00c9a7; padding: 10px 24px; border-radius: 8px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 0.85rem; color: #64748b; line-height: 1.4;">
        This code is valid for <b>10 minutes</b>. If you did not request this password reset, please ignore this email or contact support.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
      <div style="font-size: 0.75rem; color: #94a3b8; text-align: center;">
        Stellar Forge Billing · Secure Verification
      </div>
    </div>
  `

  try {
    await sendMail(env, {
      to: email,
      subject: `Your Stellar Forge Password Reset Code: ${otp}`,
      html,
    })
  } catch (err) {
    console.error('Failed to send reset email:', err)
    return json({ error: 'Failed to send reset code via email: ' + err.message }, 500)
  }

  return json({ ok: true, message: 'Password reset code sent to your email.' })
}
