import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { useShop } from '../lib/ShopContext'
import { useToast } from '../components/Toast'

const UPI = /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/
const KEYS = ['name', 'tagline', 'address', 'mobile', 'whatsapp', 'gst_no', 'upi_id', 'website', 'thank_you', 'bill_prefix', 'paper_width', 'show_upi_qr']

function resizeLogo(file, max = 400) {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      c.toBlob(b => b ? resolve(b) : reject(new Error('Bad image')), 'image/png')
    }; img.onerror = () => reject(new Error('Not an image')); img.src = URL.createObjectURL(file)
  })
}

export default function SettingsPage() {
  const { shop, ent, canWrite, reload } = useShop()
  const toast = useToast()
  const [f, setF] = useState(() => Object.fromEntries(KEYS.map(k => [k, shop?.[k] ?? (k === 'show_upi_qr' ? false : '')])))
  const [qr, setQr] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const upiOk = UPI.test(f.upi_id.trim())

  useEffect(() => {
    if (f.show_upi_qr && upiOk) QRCode.toDataURL(`upi://pay?pa=${encodeURIComponent(f.upi_id.trim())}&pn=${encodeURIComponent(f.name)}&am=1.00&cu=INR`, { margin: 1, width: 160 }).then(setQr)
    else setQr(null)
  }, [f.show_upi_qr, f.upi_id, f.name])

  const save = async () => {
    if (!f.name.trim()) return toast('Shop name is required', 'error')
    if (!/^\d{10}$/.test(f.mobile.replace(/\D/g, '').slice(-10))) return toast('Enter a 10-digit mobile', 'error')
    if (f.upi_id.trim() && !upiOk) return toast('UPI id looks wrong (example: name@bank)', 'error')
    if (f.show_upi_qr && !upiOk) return toast('Add a valid UPI id to show the QR', 'error')
    if (!/^[A-Za-z0-9-]{1,6}$/.test(f.bill_prefix)) return toast('Bill prefix: 1–6 letters, digits or -', 'error')
    setBusy(true)
    const clean = (v) => (typeof v === 'string' ? v.trim() || null : v)
    const row = { ...Object.fromEntries(KEYS.map(k => [k, clean(f[k])])), paper_width: Number(f.paper_width), bill_prefix: f.bill_prefix.trim().toUpperCase(), name: f.name.trim(), thank_you: f.thank_you.trim() || 'Thank you!' }
    row.mobile = f.mobile.replace(/\D/g, '').slice(-10); row.whatsapp = (f.whatsapp || f.mobile).replace(/\D/g, '').slice(-10)
    const { error } = await supabase.from('shops').update(row).eq('id', shop.id)
    setBusy(false)
    if (error) return toast('Could not save: ' + error.message, 'error')
    toast('Settings saved'); reload()
  }

  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const blob = await resizeLogo(file); const path = `${shop.id}/logo-${Date.now()}.png`
      const up = await supabase.storage.from('logos').upload(path, blob, { contentType: 'image/png' }); if (up.error) throw up.error
      const { error } = await supabase.from('shops').update({ logo_path: path }).eq('id', shop.id); if (error) throw error
      toast('Logo updated'); reload()
    } catch (x) { toast('Logo upload failed: ' + x.message, 'error') }
  }

  const inp = (label, k, props = {}) => (
    <div className="form-group"><label className="form-label">{label}</label><input className="form-input" value={f[k]} onChange={set(k)} {...props} /></div>)
  const logoUrl = shop?.logo_path ? supabase.storage.from('logos').getPublicUrl(shop.logo_path).data.publicUrl : null
  const end = ent?.paid_until ?? ent?.trial_ends_at

  return (
    <div className="page">
      <h1 className="page-title">Shop Settings</h1>
      <p className="page-subtitle">{canWrite ? (ent?.paid_until ? 'Plan active' : 'Free trial') : 'View only'}{end && ` · until ${new Date(end).toLocaleDateString('en-IN')}`}. Changes apply to new bills; printed bills never change.</p>
      <div className="card" style={{ padding: 20 }}>
        <h3>Shop details</h3>
        {inp('Shop name', 'name')}{inp('Second line (tagline)', 'tagline')}{inp('Address', 'address')}
        {inp('Mobile', 'mobile', { inputMode: 'numeric' })}{inp('WhatsApp', 'whatsapp', { inputMode: 'numeric' })}
        <div className="form-group"><label className="form-label">Logo (shown on PDF and WhatsApp bills)</label>
          {logoUrl && <img src={logoUrl} alt="" style={{ height: 60, display: 'block', marginBottom: 8 }} />}
          <input type="file" accept="image/*" onChange={upload} disabled={!canWrite} /></div>
        <h3>Tax and payment</h3>
        {inp('GST number (optional)', 'gst_no')}{inp('Website (optional)', 'website')}{inp('UPI id', 'upi_id', { placeholder: 'name@bank' })}
        <label><input type="checkbox" checked={f.show_upi_qr} disabled={!upiOk} onChange={set('show_upi_qr')} /> Show payment QR on bills (needs a valid UPI id)</label>
        {qr && <div><img src={qr} alt="QR preview" style={{ width: 110, marginTop: 8 }} /><div className="page-subtitle">Preview with Rs. 1.00</div></div>}
        <h3>Bill and printer</h3>
        {inp('Bill number prefix', 'bill_prefix', { maxLength: 6 })}{inp('Thank-you text', 'thank_you')}
        <div className="form-group"><label className="form-label">Printer paper</label>
          <select className="form-input" value={f.paper_width} onChange={set('paper_width')}><option value={58}>58 mm (2 inch)</option><option value={80}>80 mm (3 inch)</option></select></div>
        <button className="btn btn-primary" onClick={save} disabled={busy || !canWrite}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div></div>)
}
