import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase'
import { useShop } from '../lib/ShopContext'
import { useToast } from '../components/Toast'
import PlanCard from '../components/PlanCard'
import StaffModal from '../components/StaffModal'
import { can, getPlan, upgradeUrl } from '../lib/plans'

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
  const plan = getPlan(shop, ent)
  const [f, setF] = useState(() => Object.fromEntries(KEYS.map(k => [k, shop?.[k] ?? (k === 'show_upi_qr' ? false : '')])))
  const [qr, setQr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showStaff, setShowStaff] = useState(false)

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
  const renewalDate = ent?.paid_until || shop?.plan_renewal_date

  const hasCustomDomain = can('customDomain', shop, ent) && shop?.custom_domain
  const hasVerifiedBadge = can('verifiedBadge', shop, ent) && shop?.verified_badge

  return (
    <div className="page">
      <h1 className="page-title">Shop Settings</h1>
      <p className="page-subtitle">
        {plan.name} Plan active{renewalDate && ` · renews ${new Date(renewalDate).toLocaleDateString('en-IN')}`}. Changes apply to new bills; printed bills never change.
      </p>

      {/* Pro Badge & Custom Domain indicator if enabled */}
      {(hasCustomDomain || hasVerifiedBadge || shop?.verified_badge) && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {shop?.verified_badge && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,201,167,0.12)', color: 'var(--teal-dark)', padding: '4px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, border: '1px solid var(--teal)' }}>
              ✓ Verified Shop Badge
            </span>
          )}
          {shop?.custom_domain && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--ink)', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600 }}>
              🌐 Custom Domain: {shop.custom_domain}
            </span>
          )}
        </div>
      )}

      <PlanCard />

      {/* Pro Features section */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Staff & Roles</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Multi-user access for cashiers and helpers.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowStaff(true)}>
            👥 Manage Staff
          </button>
        </div>

        {/* Custom domain and verified badge status */}
        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, marginTop: 12, fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Custom Domain: {shop?.custom_domain ? <b>{shop.custom_domain}</b> : <span style={{ color: 'var(--text-muted)' }}>Not configured</span>}</span>
            {!can('customDomain', shop, ent) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>Pro feature</span>
                <a href={upgradeUrl(shop, null, false, 'pro')} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>WhatsApp us</a>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Verified Shop Badge: {shop?.verified_badge ? <b style={{ color: 'var(--teal-dark)' }}>Active ✓</b> : <span style={{ color: 'var(--text-muted)' }}>Off</span>}</span>
            {!can('verifiedBadge', shop, ent) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>Pro feature</span>
                <a href={upgradeUrl(shop, null, false, 'pro')} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>WhatsApp us</a>
              </span>
            )}
          </div>
        </div>
      </div>

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
      </div>

      {showStaff && <StaffModal onClose={() => setShowStaff(false)} />}
    </div>
  )
}
