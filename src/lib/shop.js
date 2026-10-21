// Shop profile helpers shared by printing, PDF, WhatsApp and bill numbers.
// Printed bills use their saved snapshot, so later profile edits never change old bills.
import { supabase } from './supabase'
import QRCode from 'qrcode'

export const SHOP = { name: '', sub: '', address: '', address2: '', phone: '', tagline: '', thankYou: 'Thank you!', logo: null, upiQr: null, _src: {} }
let live = null
let canWrite = false
export const setLiveShop = (shop, writable) => { live = shop; canWrite = !!writable }
export const getLiveShop = () => live
export const billPrefix = (bill) => bill?.snapshot?.bill_prefix ?? live?.bill_prefix ?? 'SF-'

export function guardWrite(what = 'This action') {
  if (canWrite) return true
  alert(`${what} is unavailable: your account is on hold or not approved. Contact Stellar Forge to continue.`)
  return false
}

export function upiLink(bill, s) {
  const no = billPrefix(bill) + String(bill.bill_no || '').padStart(6, '0')
  return `upi://pay?pa=${encodeURIComponent(s.upi_id)}&pn=${encodeURIComponent(s.name || '')}&am=${Number(bill.total_amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(no)}`
}

export function applyShop(bill) {
  const s = bill?.snapshot ?? live ?? {}
  Object.assign(SHOP, {
    name: s.name || '', sub: s.tagline || '', address: s.address || '', address2: '', phone: s.mobile || '',
    tagline: [s.gst_no && 'GSTIN: ' + s.gst_no, s.website].filter(Boolean).join(' · '),
    thankYou: s.thank_you || 'Thank you!', logo: null, upiQr: null, _src: s,
  })
  return SHOP
}

const cache = new Map()
async function toDataUrl(url) {
  if (cache.has(url)) return cache.get(url)
  const blob = await (await fetch(url)).blob()
  const d = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob) })
  cache.set(url, d); return d
}

export async function applyShopAssets(bill) {
  applyShop(bill)
  const s = SHOP._src
  try { if (s.logo_path) SHOP.logo = await toDataUrl(supabase.storage.from('logos').getPublicUrl(s.logo_path).data.publicUrl) } catch { /* no logo */ }
  try { if (s.show_upi_qr && s.upi_id && bill?.status === 'final') SHOP.upiQr = await QRCode.toDataURL(upiLink(bill, s), { margin: 1, width: 300 }) } catch { /* no qr */ }
  return SHOP
}
