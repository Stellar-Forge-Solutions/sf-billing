// Receipt JSON for the Thermer / Bluetooth Print app. Needs a valid signed token from /api/print-token.
// Layout width follows the shop's paper setting (58 mm = 32 chars, 80 mm = 48 chars).
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'node:crypto'

const pad = (str, len, right = false) => { const s = String(str).substring(0, len); return right ? s.padStart(len) : s.padEnd(len) }
const text = (content, { bold = 0, align = 0, format = 0 } = {}) => ({ type: 0, content, bold, align, format })
const BLANK = { type: 0, content: ' ', bold: 0, align: 0, format: 0 }

function validToken(id, t) {
  const [exp, sig] = String(t || '').split('.')
  if (!exp || !sig || Date.now() > Number(exp)) return false
  const good = createHmac('sha256', process.env.PRINT_SIGNING_SECRET).update(`${id}.${exp}`).digest('hex')
  const a = Buffer.from(sig), b = Buffer.from(good)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const id = String(req.query.id || '')
  if (!id || !validToken(id, req.query.t)) return res.status(401).json({ error: 'Invalid or expired print link' })

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const { data: bill } = await sb.from('bills').select('*').eq('id', id).maybeSingle()
  if (!bill) return res.status(404).json({ error: 'Bill not found' })
  const { data: ok } = await sb.rpc('shop_can_write', { p_shop: bill.shop_id, p_product: 'billing' })
  if (!ok) return res.status(403).json({ error: 'Billing is not active for this shop' })
  const { data: live } = await sb.from('shops').select('*').eq('id', bill.shop_id).single()
  const { data: items = [] } = await sb.from('bill_items').select('*').eq('bill_id', id).order('created_at')

  const s = bill.snapshot ?? live // printed bills keep the shop details they were printed with
  const W = live.paper_width === 80 ? 48 : 32, N = W - 22
  const SOLID = '='.repeat(W), DASH = '-'.repeat(W)
  const prefix = s.bill_prefix || 'SF-'
  const no = bill.bill_no ? prefix + String(bill.bill_no).padStart(6, '0') : prefix + String(bill.id).slice(-6).toUpperCase()
  const rows = []

  rows.push(text(s.name, { bold: 1, align: 1, format: 2 }))
  if (s.tagline) rows.push(text(s.tagline, { bold: 1, align: 1, format: 3 }))
  if (s.address) rows.push(text(s.address, { align: 1 }))
  if (s.mobile) rows.push(text(`Ph: ${s.mobile}`, { align: 1 }))
  if (s.gst_no) rows.push(text(`GSTIN: ${s.gst_no}`, { align: 1 }))
  rows.push(text(SOLID))

  const IST = { timeZone: 'Asia/Kolkata' }
  const d = bill.billing_date ? new Date(bill.billing_date + 'T00:00:00+05:30') : new Date(bill.created_at)
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...IST })
  const timeStr = new Date(bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', ...IST })
  rows.push(text(`Bill: ${no}`))
  rows.push(text(`Date: ${dateStr} ${timeStr}`))
  rows.push(text(`Cust: ${bill.customer_name}`))
  if (bill.created_by) rows.push(text(`By  : ${bill.created_by.split('@')[0]}`))
  rows.push(text(SOLID))
  rows.push(text(`${pad('#', 1)} ${pad('Item', N)} ${pad('Qty', 3, true)} ${pad('Rate', 6, true)} ${pad('Amt', 7, true)}`, { bold: 1 }))
  rows.push(text(DASH))

  let subtotal = 0
  ;(items || []).forEach((it, i) => {
    const rate = Number(it.item_price), amt = rate * Number(it.quantity)
    subtotal += amt
    rows.push(text(`${pad(i + 1, 1)} ${pad(it.item_name, N)} ${pad(it.quantity, 3, true)} ${pad(rate.toFixed(2), 6, true)} ${pad(amt.toFixed(2), 7, true)}`))
  })
  rows.push(text(SOLID))

  const discPct = Number(bill.discount_percent || 0), discAmt = Number(bill.discount_amount || 0), total = Number(bill.total_amount)
  const diff = Math.round((total - (subtotal - discAmt)) * 100) / 100
  const roundOff = Math.abs(diff) >= 0.005 && Math.abs(diff) <= 0.5 ? diff : 0
  rows.push(text(`Subtotal: Rs.${subtotal.toFixed(2)}`, { align: 2 }))
  if (discPct > 0) rows.push(text(`Disc(${discPct}%): -Rs.${discAmt.toFixed(2)}`, { align: 2 }))
  else if (discAmt > 0) rows.push(text(`Discount: -Rs.${discAmt.toFixed(2)}`, { align: 2 }))
  if (roundOff !== 0) rows.push(text(`Round off: ${roundOff > 0 ? '+' : '-'}Rs.${Math.abs(roundOff).toFixed(2)}`, { align: 2 }))
  rows.push(text(SOLID))
  rows.push(text(`TOTAL Rs.${total.toFixed(2)}`, { bold: 1, align: 1, format: 3 }))
  rows.push(text(SOLID))
  if (bill.status === 'cancelled') rows.push(text('** CANCELLED **', { bold: 1, align: 1, format: 3 }))

  if (bill.status === 'final' && s.show_upi_qr && s.upi_id) {
    const link = `upi://pay?pa=${encodeURIComponent(s.upi_id)}&pn=${encodeURIComponent(s.name)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(no)}`
    rows.push(text(`Scan to pay Rs.${total.toFixed(2)}`, { align: 1 }))
    rows.push({ type: 3, value: link, size: live.paper_width === 80 ? 50 : 38, align: 1 })
  }
  rows.push(BLANK)
  rows.push(text(s.thank_you || 'Thank you!', { bold: 1, align: 1, format: 3 }))
  if (s.website) rows.push(text(s.website, { align: 1 }))
  rows.push(text('Billing by Stellar Forge', { align: 1 }))
  rows.push(BLANK); rows.push(BLANK)

  const payload = {}; rows.forEach((r, i) => { payload[i] = r })
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json(payload)
}
