import { useEffect, useState } from 'react'

// Animated list of real advantages shown on the sign-in page. Every claim matches what the app does today.
const SLIDES = [
  { k: 'taps', h: 'Bill a regular in 4 taps', p: 'Open their last bill, tap Repeat, then print.' },
  { k: 'brand', h: 'Your shop name on every bill', p: 'Name, address, phone and GST number print on every bill. Your logo goes on PDF and WhatsApp bills.' },
  { k: 'upi', h: 'UPI QR with the exact amount', p: 'Customers scan and pay. Switch it on in Settings.' },
  { k: 'print', h: 'Any Bluetooth thermal printer', p: '58 mm or 80 mm paper, set once in Settings.' },
  { k: 'wa', h: 'Send bills on WhatsApp', p: 'Share a PDF bill in one tap.' },
  { k: 'sync', h: 'Sales that fill themselves', p: 'Connect the Expense Tracker and every printed bill becomes a sale.' },
]

const QR = Array.from({ length: 81 }, (_, i) => { const x = i % 9, y = Math.floor(i / 9); return ((x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5)) || ((x * 7 + y * 13 + x * y) % 5) < 2 })

function Visual({ k }) {
  if (k === 'taps') return (
    <div className="sf-taps">{['Open', 'Repeat', 'Print Bill', 'Print now'].map((t, i) => (
      <div key={t} className="sf-tap" style={{ '--d': `${i * 0.7}s` }}><span>{i + 1}</span><small>{t}</small></div>))}</div>)
  if (k === 'brand') return (
    <div className="sf-receipt"><b>YOUR SHOP NAME</b><i style={{ '--d': '0.2s' }} /><i style={{ '--d': '0.5s' }} /><i style={{ '--d': '0.8s', width: '60%' }} /><em>GST · Phone · Address</em></div>)
  if (k === 'upi') return (
    <div className="sf-qr"><svg viewBox="0 0 9 9" width="86" height="86">{QR.map((on, i) => on && <rect key={i} x={i % 9} y={Math.floor(i / 9)} width="1" height="1" />)}</svg><span>Rs. 255.00</span></div>)
  if (k === 'print') return (
    <div className="sf-paper"><div style={{ '--d': '0s' }}>58 mm</div><div style={{ '--d': '1.4s' }}>80 mm</div></div>)
  if (k === 'wa') return <div className="sf-wa">💬 Bill_SF-000119.pdf</div>
  return <div className="sf-sync"><div>Billing</div><span /><div>Expenses</div></div>
}

export default function LoginShowcase() {
  const [i, setI] = useState(0)
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(() => { if (reduced) return; const t = setInterval(() => setI(n => (n + 1) % SLIDES.length), 3600); return () => clearInterval(t) }, [reduced])

  if (reduced) return (
    <ul className="sf-static">{SLIDES.map(s => <li key={s.k}><b>{s.h}</b><span>{s.p}</span></li>)}</ul>)

  const s = SLIDES[i]
  return (
    <div className="sf-show" aria-live="polite">
      <div key={'v' + i} className="sf-vis"><Visual k={s.k} /></div>
      <h2 key={'h' + i} className="sf-h">{s.h.split(' ').map((w, n) => <span key={n} className="sf-word" style={{ '--i': n }}>{w}</span>)}</h2>
      <p key={'p' + i} className="sf-p">{s.p}</p>
      <div className="sf-dots">{SLIDES.map((_, n) => <button key={n} aria-label={`Show benefit ${n + 1}`} className={n === i ? 'on' : ''} onClick={() => setI(n)} />)}</div>
    </div>)
}
