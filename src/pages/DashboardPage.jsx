import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { isOwner } from '../lib/roles'
import { bluetoothPrint } from '../lib/print'
import { billTotals, billNo, billLabel, billDay, todayIST, shiftDay, matchesSearch, billsToCsv, itemsToCsv, downloadFile } from '../lib/billUtils'
import { SHOP, applyShop, applyShopAssets, guardWrite, getLiveShop } from '../lib/shop'

// ── Logo (from ItemsPage) ─────────────────────────────────────────

// ── Shop config ───────────────────────────────────────────────────

// ── Effective billing date ──────────────────────────────────────────
// Bills store a `billing_date` (date-only, picked at creation — can be
// backdated). Older bills created before this field existed won't have
// it, so fall back to `created_at`. The +05:30 anchor keeps the date
// stable in IST regardless of the viewer's own timezone.
function billingDateObj(bill) {
  return bill.billing_date
    ? new Date(bill.billing_date + 'T00:00:00+05:30')
    : new Date(bill.created_at)
}
// ── Print receipt ─────────────────────────────────────────────────
// Builds a 58mm-optimised HTML receipt, opens it in a new tab, and
// calls window.print() automatically — Android then shows the native
// print dialog where the paired Bluetooth printer appears directly.
function printBill(bill, items) {
  if (!guardWrite('Printing')) return
  applyShop(bill)
  const dateStr  = billingDateObj(bill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const timeStr  = new Date(bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  const subtotal = Number(bill.total_amount) + Number(bill.discount_amount || 0)
  const discPct  = Number(bill.discount_percent || 0)
  const discAmt  = Number(bill.discount_amount  || 0)
  const total    = Number(bill.total_amount)

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.item_name}</td>
      <td class="c">${item.quantity}</td>
      <td class="r">${Number(item.item_price).toFixed(2)}</td>
      <td class="r">${(item.item_price * item.quantity).toFixed(2)}</td>
    </tr>`).join('')

  const discRow = discPct > 0 ? `
    <tr class="disc">
      <td colspan="4" class="r">Discount (${discPct}%)</td>
      <td class="r">- ${discAmt.toFixed(2)}</td>
    </tr>` : ''

  const staffLine = bill.created_by ? `<div>Staff: ${bill.created_by.split('@')[0]}</div>` : ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bill ${billNo(bill)}</title>
  <style>
    @page { size: 58mm auto; margin: 2mm 1px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      width: 56mm;
      color: #000;
      background: #fff;
    }
    .hdr  { text-align: center; margin-bottom: 4px; }
    .s1   { font-size: 22px; font-weight: bold; }
    .s2   { font-size: 16px; font-weight: bold; }
    .s3   { font-size: 13px; color: #333; }
    hr.dl { border: none; border-top: 1.5px solid #000; margin: 4px 0; }
    hr.dd { border: none; border-top: 1px dashed #888; margin: 4px 0; }
    .meta { font-size: 15px; margin-bottom: 3px; line-height: 1.5; }
    .row  { display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; }
    th  { font-size: 15px; font-weight: bold; padding: 3px 0; border-bottom: 1px dashed #888; text-align: left; }
    td  { font-size: 16px; padding: 2px 0; vertical-align: top; line-height: 1.4; }
    td.c { text-align: center; width: 18px; }
    td.r { text-align: right; }
    td:nth-child(1) { width: 14px; font-size: 14px; color: #555; }
    td:nth-child(4) { width: 34px; }
    td:nth-child(5) { width: 36px; }
    .sub td  { font-size: 15px; color: #333; padding-top: 4px; }
    .disc td { color: #c00; font-size: 15px; }
    .tot     { border-top: 2px solid #000; }
    .tot td  { font-size: 22px; font-weight: bold; padding-top: 4px; }
    .ftr  { text-align: center; font-size: 16px; color: #333; margin-top: 8px; line-height: 1.6; font-weight: bold; }
    .ftr small { font-size: 14px; font-weight: normal; color: #555; }
    @media print {
      body { width: auto !important; zoom: 1 !important; transform: none !important; }
    }
  </style>
</head>
<body>
  <div class="hdr">
    <div class="s1">${SHOP.name}</div>
    <div class="s2">${SHOP.sub}</div>
    <div class="s3">${SHOP.address}</div>
    ${SHOP.phone ? `<div class="s3">Ph: ${SHOP.phone}</div>` : ''}
  </div>
  <hr class="dl">
  <div class="meta">
    <div class="row"><span><b>Bill:</b> ${billNo(bill)}</span><span>${dateStr} ${timeStr}</span></div>
    <div><b>Customer:</b> ${bill.customer_name}</div>
    ${staffLine}
  </div>
  <hr class="dd">
  <table>
    <thead>
      <tr><th>#</th><th>Item</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="sub">
        <td colspan="4" class="r"><b>Subtotal</b></td>
        <td class="r"><b>${subtotal.toFixed(2)}</b></td>
      </tr>
      ${discRow}
    </tbody>
  </table>
  <hr class="dl">
  <table class="tot">
    <tr>
      <td><b>TOTAL</b></td>
      <td colspan="4" class="r"><b>Rs. ${total.toFixed(2)}</b></td>
    </tr>
  </table>
  <div class="ftr">
    ${SHOP.thankYou}<br>
    <small>${SHOP.tagline ? SHOP.tagline + '<br>' : ''}Billing by Stellar Forge</small>
  </div>
</body>
<script>
  // Auto-trigger Android native print dialog on load.
  // Receipt Printer Driver intercepts this and routes to
  // the paired Bluetooth printer — no extra taps needed.
  window.onload = function() {
    setTimeout(function() { window.print(); }, 300);
  };
</script>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (!win) {
    // Fallback if popup blocked — open in same tab
    window.location.href = url
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// ── Generate professional A4 invoice PDF ─────────────────────────
// Matches the invoice template — logo, shop details, itemised table,
// totals. No GST/transporter fields. Uploaded to Supabase Storage.
async function generateInvoicePDF(bill, items) {
  await applyShopAssets(bill)
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210, H = 297
  let y = 0

  const dateStr = billingDateObj(bill).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
  })
  const { subtotal, discount: discAmt, roundOff, total, discountLabel } = billTotals(bill, items)

  // ── helpers ──
  const solidLine = (yy, lw = 0.4) => {
    doc.setDrawColor(0); doc.setLineWidth(lw)
    doc.line(10, yy, W - 10, yy)
  }
  const thinLine = (yy) => {
    doc.setDrawColor(180); doc.setLineWidth(0.2)
    doc.line(10, yy, W - 10, yy)
  }
  const txt = (str, x, yy, opts = {}) => {
    doc.setFontSize(opts.size || 9)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setTextColor(...(opts.color || [0,0,0]))
    doc.text(String(str), x, yy, { align: opts.align || 'left', ...opts.extra })
  }

  // ── OUTER BORDER ──
  doc.setDrawColor(0); doc.setLineWidth(0.5)
  doc.rect(10, 10, W - 20, H - 20)

  // ── TOP BAR: Page / TAX INVOICE / Original Copy ──
  y = 14
  txt('Page No. 1 of 1', 12, y, { size: 8 })
  txt('BILL', W / 2, y, { size: 13, bold: true, align: 'center' })
  txt('Original Copy', W - 12, y, { size: 8, align: 'right' })
  y += 2; thinLine(y); y += 5

  // ── LOGO + COMPANY HEADER ──
  // Logo left box
  doc.setDrawColor(180); doc.setLineWidth(0.3)
  doc.rect(12, y, 22, 22)
  try { doc.addImage(SHOP.logo, 'PNG', 13, y + 1, 20, 20) } catch(e) {}

  // Company name centred
  txt(SHOP.name, W / 2, y + 5, { size: 16, bold: true, align: 'center' })
  txt(SHOP.sub, W / 2, y + 10, { size: 10, bold: true, align: 'center', color: [80, 80, 80] })
  txt(SHOP.address, W / 2, y + 15, { size: 8, align: 'center', color: [100,100,100] })
  txt('Mobile: ' + SHOP.phone, W / 2, y + 20, { size: 8, align: 'center', color: [100,100,100] })
  y += 26; thinLine(y); y += 2

  // ── INVOICE META ──
  const col1x = 12, col2x = W / 2 + 5
  txt('Invoice Number', col1x, y + 4, { size: 8, bold: true })
  txt(': ' + billNo(bill), col1x + 32, y + 4, { size: 8 })
  txt('Invoice Date', col1x, y + 9, { size: 8, bold: true })
  txt(': ' + dateStr, col1x + 32, y + 9, { size: 8 })

  // vertical separator
  doc.setDrawColor(180); doc.setLineWidth(0.2)
  doc.line(W / 2, y, W / 2, y + 14)

  txt('Customer Name', col2x, y + 4, { size: 8, bold: true })
  txt(': ' + bill.customer_name, col2x + 32, y + 4, { size: 8 })
  if (bill.created_by) {
    txt('Staff', col2x, y + 9, { size: 8, bold: true })
    txt(': ' + bill.created_by.split('@')[0], col2x + 32, y + 9, { size: 8 })
  }
  y += 16; thinLine(y); y += 2

  // ── ITEMS TABLE HEADER ──
  doc.setFillColor(240, 240, 240)
  doc.rect(10, y, W - 20, 7, 'F')
  const cols = { sr: 12, item: 20, qty: 120, rate: 145, disc: 165, amt: 180 }
  txt('Sr.', cols.sr, y + 5, { size: 8, bold: true })
  txt('Item Description', cols.item, y + 5, { size: 8, bold: true })
  txt('Qty', cols.qty, y + 5, { size: 8, bold: true, align: 'right' })
  txt('Rate', cols.rate, y + 5, { size: 8, bold: true, align: 'right' })
  txt('Disc.', cols.disc, y + 5, { size: 8, bold: true, align: 'right' })
  txt('Amount (₹)', W - 12, y + 5, { size: 8, bold: true, align: 'right' })
  y += 7; thinLine(y)

  // ── ITEM ROWS ──
  items.forEach((item, i) => {
    y += 7
    const lineTotal = (Number(item.item_price) * Number(item.quantity)).toFixed(2)
    txt(String(i + 1), cols.sr, y, { size: 8 })
    // Wrap long names
    const nameLines = doc.splitTextToSize(item.item_name, 90)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0)
    doc.text(nameLines, cols.item, y)
    txt(item.quantity, cols.qty, y, { size: 8, align: 'right' })
    txt(Number(item.item_price).toFixed(2), cols.rate, y, { size: 8, align: 'right' })
    txt('', cols.disc, y, { size: 8, align: 'right' })
    txt(lineTotal, W - 12, y, { size: 8, align: 'right' })
    if (nameLines.length > 1) y += (nameLines.length - 1) * 4.5
    thinLine(y + 2)
  })

  y += 8

  // ── SUBTOTAL / DISCOUNT / TOTAL ──
  thinLine(y); y += 5
  txt('Subtotal', cols.item, y, { size: 8 })
  txt(subtotal.toFixed(2), W - 12, y, { size: 8, align: 'right' })

  if (discAmt > 0) {
    y += 5
    txt(discountLabel, cols.item, y, { size: 8, color: [180, 0, 0] })
    txt('- ' + discAmt.toFixed(2), W - 12, y, { size: 8, align: 'right', color: [180,0,0] })
  }
  if (roundOff !== 0) {
    y += 5
    txt('Round off', cols.item, y, { size: 8 })
    txt((roundOff > 0 ? '+ ' : '- ') + Math.abs(roundOff).toFixed(2), W - 12, y, { size: 8, align: 'right' })
  }

  y += 4; solidLine(y, 0.8); y += 6
  txt('TOTAL', cols.item, y, { size: 12, bold: true })
  txt('Rs. ' + total.toFixed(2), W - 12, y, { size: 12, bold: true, align: 'right', color: [0, 130, 60] })
  if (SHOP.upiQr && y + 38 < H - 32) {
    try { doc.addImage(SHOP.upiQr, 'PNG', W / 2 - 13, y + 5, 26, 26) } catch (e) {}
    txt('Scan to pay Rs. ' + total.toFixed(2), W / 2, y + 35, { size: 7, align: 'center', color: [100,100,100] })
  }

  // ── FOOTER ──
  y = H - 30; thinLine(y); y += 5
  txt(SHOP.tagline, W / 2, y, { size: 8, align: 'center', color: [100,100,100] })
  txt(SHOP.thankYou, W / 2, y + 4, { size: 8, align: 'center', color: [100,100,100] })
  txt(SHOP.name + ' · ' + SHOP.phone, W / 2, y + 8, { size: 7, align: 'center', color: [150,150,150] })
  txt('Billing by Stellar Forge', W / 2, y + 12, { size: 7, align: 'center', color: [0, 150, 130] })

  return doc
}

// ── Upload PDF to Supabase Storage & return public URL ────────────
async function uploadBillPDF(bill, items) {
  if (!guardWrite('Sharing')) throw new Error('View only')
  const doc      = await generateInvoicePDF(bill, items)
  const pdfBytes = doc.output('arraybuffer')
  const filename = `${getLiveShop()?.id}/${billNo(bill)}-${Date.now()}.pdf`
  const { error } = await supabase.storage
    .from('bills')
    .upload(filename, pdfBytes, { contentType: 'application/pdf', upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('bills').getPublicUrl(filename)
  return data.publicUrl
}

// ── WhatsApp modal ────────────────────────────────────────────────
function WhatsAppModal({ bill, items, onClose }) {
  const toast = useToast()
  const [phone, setPhone]       = useState(SHOP.phone.replace(/\D/g,'').startsWith('91') ? '' : '')
  const [sending, setSending]   = useState(false)
  const [step, setStep]         = useState('input') // 'input' | 'uploading' | 'done'
  const [pdfUrl, setPdfUrl]     = useState(null)

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return toast('Enter a valid 10-digit number', 'error')
    const fullNumber = digits.startsWith('91') ? digits : '91' + digits.slice(-10)

    setSending(true)
    setStep('uploading')
    try {
      const url = await uploadBillPDF(bill, items)
      setPdfUrl(url)

      const total    = Number(bill.total_amount).toFixed(2)
      const dateStr  = billingDateObj(bill).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
      const message  = `🧾 *${SHOP.name}*\n\nDear *${bill.customer_name}*,\n\nYour bill ${billNo(bill)} dated ${dateStr}\n💰 Total: *Rs. ${total}*\n\nDownload your invoice:\n${url}\n\n${SHOP.thankYou} 🙏\n_${SHOP.name}${SHOP.sub ? ' ' + SHOP.sub : ''}_\n_Billing by Stellar Forge_`

      const waUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
      window.open(waUrl, '_blank')
      setStep('done')
      toast('WhatsApp opened!')
    } catch (e) {
      toast('Failed: ' + e.message, 'error')
      setStep('input')
    }
    setSending(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: '1.5rem' }}>💬</div>
          <div className="modal-title" style={{ marginBottom: 0 }}>Send Bill on WhatsApp</div>
        </div>
        <div className="modal-subtitle">{bill.customer_name} · {billNo(bill)} · Rs.{Number(bill.total_amount).toFixed(2)}</div>

        {step === 'done' && pdfUrl ? (
          <div>
            <div style={{ background: '#d1fae5', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16, fontSize: '0.85rem', color: '#065f46' }}>
              ✓ WhatsApp opened with bill link! If it didn't open, tap below.
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>PDF link (copy if needed)</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', background: 'var(--paper)', padding: '8px', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                {pdfUrl}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-full btn-sm" onClick={onClose}>Close</button>
              <button className="btn btn-primary btn-full btn-sm" onClick={() => setStep('input')}>Send Again</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Customer WhatsApp Number</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ background: 'var(--paper)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 10px', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>+91</div>
                <input
                  className="form-input"
                  type="tel" maxLength={10} placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  autoFocus
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.1em' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--paper)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
              {step === 'uploading' ? (
                <div style={{ textAlign: 'center', color: 'var(--teal-dark)', fontWeight: 600 }}>⏳ Generating PDF & uploading…</div>
              ) : (
                <>
                  📄 A PDF invoice will be generated & uploaded<br/>
                  💬 WhatsApp opens with the bill link + message<br/>
                  👆 Customer taps to download their invoice
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-full" onClick={onClose} disabled={sending}>Cancel</button>
              <button
                className="btn btn-full"
                style={{ background: '#25D366', color: '#fff', fontWeight: 700 }}
                onClick={handleSend}
                disabled={sending || phone.length < 10}
              >
                {sending ? '⏳ Processing…' : '💬 Send on WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Discount modal ────────────────────────────────────────────────

// ── Deleting drafts ────────────────────────────────────────────────
// Only drafts can ever be deleted (the database enforces it too). Returns how many were deleted.
async function deleteDraftBills(ids) {
  const { data, error } = await supabase.from('bills').delete().in('id', ids).eq('status', 'draft').select('id')
  if (error) throw new Error(error.message)
  return data?.length || 0
}

const STATUS_BADGE = { draft: '💾 Draft', final: '🖨️ Printed', cancelled: '🚫 Cancelled' }
const dangerBtn = { color: 'var(--danger)', border: '1.5px solid var(--danger)', background: 'none' }

// ── Bill detail modal ───────────────────────────────────────────────
function BillDetailModal({ bill, owner, onClose, onEdit, onRepeat, onChanged, onCustomer }) {
  const [items, setItems] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from('bill_items').select('*').eq('bill_id', bill.id)
    setItems(data || [])
    setLoading(false)
  }, [bill.id])

  useEffect(() => { loadItems() }, [loadItems])

  const t = billTotals(bill, items)

  const handleDeleteDraft = async () => {
    if (!window.confirm(`Delete this draft for ${bill.customer_name}? This cannot be undone.`)) return
    setBusy(true)
    try {
      const n = await deleteDraftBills([bill.id])
      if (!n) toast('Could not delete — run the part-2 SQL update first', 'error')
      else { toast('Draft deleted'); onChanged() }
    } catch (e) { toast('Failed to delete: ' + e.message, 'error') }
    setBusy(false)
  }

  const handleCancel = async () => {
    const why = reason.trim()
    if (!why) return toast('Please enter a reason', 'error')
    setBusy(true)
    const { data, error } = await supabase.from('bills')
      .update({ status: 'cancelled', cancel_reason: why, cancelled_at: new Date().toISOString() })
      .eq('id', bill.id).eq('status', 'final').select('id')
    setBusy(false)
    if (error || !data?.length) return toast('Could not cancel — run the part-2 SQL update first', 'error')
    toast('Bill cancelled')
    onChanged()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ background: 'var(--ink)', borderRadius: 'var(--radius)', padding: '18px 16px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Customer</div>
          <div style={{ color: 'var(--white)', fontSize: '0.9rem', fontWeight: 700, marginTop: 3 }}>{bill.customer_name}</div>
          <button onClick={() => onCustomer(bill.customer_name)}
            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', marginTop: 2 }}>
            📋 All bills from this customer
          </button>
          <div style={{ color: 'var(--teal)', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginTop: 6, textDecoration: bill.status === 'cancelled' ? 'line-through' : 'none' }}>
            ₹{Number(bill.total_amount).toFixed(2)}
          </div>
          {t.discount > 0 && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: 4 }}>
              After ₹{t.discount.toFixed(2)} discount{t.pct > 0 ? ` (${t.pct}%)` : ''}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <span className={`badge badge-${bill.status}`}>{STATUS_BADGE[bill.status] || bill.status}</span>
          </div>
        </div>

        {bill.status === 'cancelled' && (
          <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.825rem', marginBottom: 14 }}>
            <b>Cancelled</b>{bill.cancelled_at ? ' on ' + new Date(bill.cancelled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : ''}
            {bill.cancel_reason ? <div style={{ marginTop: 2 }}>Reason: {bill.cancel_reason}</div> : null}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>Loading…</div>
          ) : items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{i + 1}. {item.item_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  ₹{Number(item.item_price).toFixed(2)} × {item.quantity}
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem' }}>
                ₹{(item.item_price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          <div style={{ paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>Subtotal</span><span className="font-mono">₹{t.subtotal.toFixed(2)}</span>
            </div>
            {t.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--danger)', marginBottom: 4 }}>
                <span>{t.discountLabel}</span>
                <span className="font-mono">− ₹{t.discount.toFixed(2)}</span>
              </div>
            )}
            {t.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Round off</span>
                <span className="font-mono">{t.roundOff > 0 ? '+' : '−'} ₹{Math.abs(t.roundOff).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', paddingTop: 8, borderTop: '1.5px solid var(--ink)' }}>
              <span>Total</span>
              <span className="font-mono" style={{ color: 'var(--teal-dark)' }}>₹{Number(bill.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div>Bill: {billLabel(bill)} · {billingDateObj(bill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} {new Date(bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
          {bill.billing_date && billDay(bill) !== billDay({ created_at: bill.created_at }) && (
            <div style={{ fontStyle: 'italic' }}>Backdated · entered on {new Date(bill.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
          )}
          {bill.created_by && <div>Created by: <span style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>{bill.created_by.split('@')[0]}</span></div>}
        </div>

        {cancelling ? (
          <div>
            <label className="form-label">Why is this bill being cancelled?</label>
            <input className="form-input" autoFocus placeholder="e.g. wrong items, customer returned" value={reason}
              onChange={e => setReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCancel()} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '6px 0 10px' }}>
              The bill stays in your records, marked cancelled, and is left out of sales totals.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setCancelling(false)}>Back</button>
              <button className="btn btn-sm btn-full" style={{ background: 'var(--danger)', color: '#fff', fontWeight: 700 }} disabled={busy} onClick={handleCancel}>
                {busy ? 'Cancelling…' : 'Confirm cancel bill'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bill.status === 'draft' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-full btn-sm" onClick={() => onEdit(bill)}>✏️ Edit Draft</button>
                <button className="btn btn-sm" style={dangerBtn} disabled={busy} onClick={handleDeleteDraft}>🗑️ Delete</button>
              </div>
            )}
            {bill.status === 'final' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-dark btn-full btn-sm"
                  title="Bluetooth thermal printer -- requires 'Bluetooth Print' app on Android"
                  onClick={() => bluetoothPrint(bill)}>
                  🖨️ Print
                </button>
                <button className="btn btn-full btn-sm"
                  style={{ background: '#25D366', color: '#fff', fontWeight: 700 }}
                  title="Send bill via WhatsApp"
                  onClick={() => setShowWhatsApp(true)}
                  disabled={loading}>
                  💬 WhatsApp
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
              {bill.status !== 'draft' && (
                <button className="btn btn-secondary btn-full btn-sm" title="Start a new bill with the same customer and items" onClick={() => onRepeat(bill)}>🔁 Repeat bill</button>
              )}
              {owner && bill.status === 'final' && (
                <button className="btn btn-sm" style={dangerBtn} onClick={() => setCancelling(true)}>🚫 Cancel bill</button>
              )}
            </div>
          </div>
        )}
      </div>
      {showWhatsApp && !loading && <WhatsAppModal bill={bill} items={items} onClose={() => setShowWhatsApp(false)} />}
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────
const RANGES = [
  { id: 'today', label: 'Today' }, { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: 'all', label: 'All time' },
]
const LOAD_DAYS = 35            // how far back bills are loaded at first (drafts are always loaded)
const OLD_DRAFT_DAYS = 7

function rangeBounds(range, picked, today) {
  if (range === 'today')     return [today, today]
  if (range === 'yesterday') { const y = shiftDay(today, -1); return [y, y] }
  if (range === '7d')        return [shiftDay(today, -6), today]
  if (range === '30d')       return [shiftDay(today, -29), today]
  if (range === 'date')      return [picked, picked]
  return ['0000-00-00', '9999-99-99']
}

export default function DashboardPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const owner    = isOwner(user?.email)
  const today    = todayIST()

  const [bills, setBills]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('all')          // all | draft | final | cancelled
  const [range, setRange]       = useState('today')
  const [picked, setPicked]     = useState(today)
  const [search, setSearch]     = useState('')
  const [loadedSince, setLoadedSince] = useState(() => shiftDay(todayIST(), -LOAD_DAYS))
  const [selectedBill, setSelectedBill] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [customerFocus, setCustomerFocus] = useState(null)   // show one customer's full history

  const fetchBills = useCallback(async () => {
    const [drafts, rest] = await Promise.all([
      supabase.from('bills').select('*').eq('status', 'draft'),
      supabase.from('bills').select('*').neq('status', 'draft')
        .gte('created_at', loadedSince + 'T00:00:00+05:30').order('created_at', { ascending: false }),
    ])
    if (drafts.error || rest.error) toast('Failed to load bills', 'error')
    else {
      // Newest billing day first; created_at breaks ties within a day.
      const sorted = [...(drafts.data || []), ...(rest.data || [])].sort((a, b) =>
        billDay(b).localeCompare(billDay(a)) || new Date(b.created_at) - new Date(a.created_at))
      setBills(sorted)
    }
    setLoading(false)
  }, [toast, loadedSince])

  useEffect(() => {
    fetchBills()
    const channel = supabase.channel('bills-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchBills)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchBills])

  // Picking a date older than what is loaded pulls in the older bills.
  const pickDate = d => {
    if (!d) return
    setPicked(d); setRange('date')
    if (d < loadedSince) setLoadedSince(shiftDay(d, -1))
  }

  const [from, to] = rangeBounds(range, picked, today)
  const drafts     = bills.filter(b => b.status === 'draft')
  // Drafts tab ignores the date range so an old draft is never hidden.
  const sameCustomer = b => !customerFocus || (b.customer_name || '').trim().toLowerCase() === customerFocus.trim().toLowerCase()
  const inPeriod   = bills.filter(b => b.status !== 'draft' && billDay(b) >= from && billDay(b) <= to && matchesSearch(b, search) && sameCustomer(b))
  const visible    = status === 'draft'
    ? drafts.filter(b => matchesSearch(b, search) && sameCustomer(b))
    : bills.filter(b => (status === 'all' || b.status === status) && billDay(b) >= from && billDay(b) <= to && matchesSearch(b, search) && sameCustomer(b))
  const printed    = inPeriod.filter(b => b.status === 'final')
  const sales      = printed.reduce((t, b) => t + Number(b.total_amount), 0)
  const periodLabel = range === 'date' ? picked : RANGES.find(r => r.id === range)?.label
  // Sales by staff member for the period on screen (printed bills only)
  const byStaff = Object.values(printed.reduce((m, b) => {
    const name = (b.created_by || 'unknown').split('@')[0]
    const e = (m[name] ||= { name, total: 0, count: 0 }); e.total += Number(b.total_amount); e.count++
    return m
  }, {})).sort((a, b) => b.total - a.total)

  // One customer's history (every bill we have loaded for them)
  const custBills   = customerFocus ? bills.filter(sameCustomer) : []
  const custPrinted = custBills.filter(b => b.status === 'final')
  const custTotal   = custPrinted.reduce((t, b) => t + Number(b.total_amount), 0)

  const focusCustomer = name => {
    setSelectedBill(null); setStatus('all'); setRange('all'); setSearch(name); setCustomerFocus(name)
    setLoadedSince('2020-01-01')                       // pull in their older bills too
  }
  const clearCustomer = () => { setCustomerFocus(null); setSearch(''); setRange('today'); setLoadedSince(shiftDay(todayIST(), -LOAD_DAYS)) }

  const oldDrafts  = drafts.filter(b => Date.now() - new Date(b.created_at) > OLD_DRAFT_DAYS * 86400000)

  const removeDrafts = async (list, label) => {
    if (!list.length) return
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return
    try {
      const n = await deleteDraftBills(list.map(b => b.id))
      if (!n) toast('Could not delete — run the part-2 SQL update first', 'error')
      else { toast(n === 1 ? 'Draft deleted' : `${n} drafts deleted`); fetchBills() }
    } catch (e) { toast('Failed to delete: ' + e.message, 'error') }
  }

  const exportCsv = async kind => {
    const list = visible.filter(b => b.status !== 'draft')
    if (!list.length) return toast('Nothing to export for this view', 'error')
    setExporting(true)
    try {
      const ids = list.map(b => b.id), lines = []
      for (let i = 0; i < ids.length; i += 80) {        // chunks keep the request small
        const { data, error } = await supabase.from('bill_items').select('*').in('bill_id', ids.slice(i, i + 80))
        if (error) throw new Error(error.message)
        lines.push(...(data || []))
      }
      const tag = range === 'date' ? picked : range
      if (kind === 'bills') {
        const byBill = {}; lines.forEach(l => (byBill[l.bill_id] ||= []).push(l))
        downloadFile(`bills-${tag}-${today}.csv`, billsToCsv(list, byBill))
      } else {
        const okIds = new Set(list.filter(b => b.status === 'final').map(b => b.id))
        downloadFile(`items-sold-${tag}-${today}.csv`, itemsToCsv(lines.filter(l => okIds.has(l.bill_id))))
      }
      toast('Downloaded')
    } catch (e) { toast('Export failed: ' + e.message, 'error') }
    setExporting(false)
  }

  const tabs = [['all', 'All'], ['draft', `💾 Drafts (${drafts.length})`], ['final', '🖨️ Printed'], ['cancelled', '🚫 Cancelled']]

  return (
    <div className="page-wide">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Billing Dashboard</h1>
          <p className="page-subtitle">
            {owner ? 'Drafts, printed bills and sales' : 'Drafts and printed bills'}
            {owner && <span style={{ marginLeft: 8, background: 'var(--teal-glow)', color: 'var(--teal-dark)', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: '1px solid var(--teal)' }}>Owner</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/bill')}>+ New Bill</button>
      </div>

      <div className="stats-row" style={owner ? undefined : { gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {owner && <div className="stat-card"><div className="stat-label">Sales · {periodLabel}</div><div className="stat-value teal" style={{ fontSize: '1.2rem' }}>₹{sales.toFixed(0)}</div></div>}
        <div className="stat-card"><div className="stat-label">Printed bills</div><div className="stat-value">{printed.length}</div></div>
        <div className="stat-card"><div className="stat-label">Drafts</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{drafts.length}</div></div>
      </div>

      {customerFocus && (
        <div className="card" style={{ padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>📋 {customerFocus}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {custPrinted.length} printed bill{custPrinted.length === 1 ? '' : 's'}{owner && <> · <b style={{ color: 'var(--teal-dark)' }}>₹{custTotal.toFixed(0)}</b> total</>}
              {custPrinted[0] ? ` · last on ${billDay(custPrinted[0])}` : ''}
              {custBills.some(b => b.status === 'draft') ? ` · ${custBills.filter(b => b.status === 'draft').length} draft(s)` : ''}
            </div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={clearCustomer}>✕ Close</button>
        </div>
      )}

      {owner && byStaff.length > 0 && !customerFocus && (
        <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Sales by staff · {periodLabel}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {byStaff.map(x => (
              <div key={x.name} style={{ fontSize: '0.85rem' }}>
                <b>{x.name}</b> <span className="font-mono" style={{ color: 'var(--teal-dark)' }}>₹{x.total.toFixed(0)}</span>
                <span style={{ color: 'var(--text-muted)' }}> · {x.count} bill{x.count === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {tabs.map(([id, label]) => (
          <button key={id} className={`btn btn-sm ${status === id ? 'btn-dark' : 'btn-secondary'}`} onClick={() => setStatus(id)}>{label}</button>
        ))}
      </div>

      {status !== 'draft' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {RANGES.map(r => (
            <button key={r.id} className={`btn btn-sm ${range === r.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
          <input type="date" aria-label="Pick a date" value={range === 'date' ? picked : ''} max={today}
            onChange={e => pickDate(e.target.value)}
            style={{ border: `1.5px solid ${range === 'date' ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '0.85rem', fontFamily: 'inherit' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: 180 }} placeholder="Search customer or bill number…" value={search} onChange={e => { setSearch(e.target.value); if (customerFocus) setCustomerFocus(null) }} />
        {status === 'draft' ? (owner &&
          <button className="btn btn-sm" style={dangerBtn} disabled={!oldDrafts.length} onClick={() => removeDrafts(oldDrafts, `${oldDrafts.length} draft${oldDrafts.length === 1 ? '' : 's'} older than ${OLD_DRAFT_DAYS} days`)}>
            🧹 Clear old drafts ({oldDrafts.length})
          </button>
        ) : (owner &&
          <>
            <button className="btn btn-sm btn-secondary" disabled={exporting} onClick={() => exportCsv('bills')}>⬇️ Bills (Excel)</button>
            <button className="btn btn-sm btn-secondary" disabled={exporting} onClick={() => exportCsv('items')}>⬇️ Items sold</button>
          </>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-title">Loading…</div></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">
              {search ? 'No bills match your search' : status === 'draft' ? 'No drafts' : status === 'final' ? 'No printed bills' : status === 'cancelled' ? 'No cancelled bills' : `No bills for ${periodLabel}`}
            </div>
            {status === 'all' && !search && range === 'today' && <button className="btn btn-primary mt-3" onClick={() => navigate('/bill')}>+ Create a Bill</button>}
          </div>
        ) : visible.map((bill, idx) => (
          <div key={bill.id} onClick={() => setSelectedBill(bill)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: idx < visible.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', opacity: bill.status === 'cancelled' ? 0.6 : 1, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--paper)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.925rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.customer_name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {billLabel(bill)} · {billingDateObj(bill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} {new Date(bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
              </div>
              {bill.created_by && (
                <div style={{ fontSize: '0.68rem', marginTop: 2, color: 'var(--teal-dark)', opacity: 0.85 }}>👤 {bill.created_by.split('@')[0]}</div>
              )}
            </div>
            {owner && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.85rem', textDecoration: bill.status === 'cancelled' ? 'line-through' : 'none' }}>₹{Number(bill.total_amount).toFixed(2)}</div>
                {Number(bill.discount_amount) > 0 && <div style={{ fontSize: '0.68rem', color: 'var(--danger)' }}>-₹{Number(bill.discount_amount).toFixed(0)} off</div>}
              </div>
            )}
            <div style={{ flexShrink: 0 }}>
              <span className={`badge badge-${bill.status}`}>{STATUS_BADGE[bill.status]?.split(' ')[0]}</span>
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              {bill.status === 'final' && (
                <button className="btn btn-sm btn-dark" style={{ padding: '5px 9px', minHeight: 32 }}
                  title="Bluetooth Print" onClick={e => { e.stopPropagation(); bluetoothPrint(bill) }}>
                  🖨️
                </button>
              )}
              {bill.status === 'draft' && (
                <button className="btn btn-sm" style={{ ...dangerBtn, padding: '5px 9px', minHeight: 32 }} aria-label={`Delete draft for ${bill.customer_name}`}
                  title="Delete draft" onClick={e => { e.stopPropagation(); removeDrafts([bill], `the draft for ${bill.customer_name}`) }}>
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {status !== 'draft' && (
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Bills loaded since {loadedSince} ·{' '}
          <button className="btn btn-sm btn-ghost" style={{ minHeight: 0, padding: '2px 8px' }} onClick={() => setLoadedSince(shiftDay(loadedSince, -30))}>Load 30 more days</button>
        </div>
      )}

      {selectedBill && (
        <BillDetailModal bill={selectedBill} owner={owner}
          onClose={() => setSelectedBill(null)}
          onChanged={() => { setSelectedBill(null); fetchBills() }}
          onEdit={b => navigate(`/bill/${b.id}`)}
          onRepeat={b => navigate(`/bill?copy=${b.id}`)}
          onCustomer={focusCustomer} />
      )}
    </div>
  )
}
