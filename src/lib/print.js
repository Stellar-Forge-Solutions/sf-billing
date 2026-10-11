// Bluetooth thermal printing via the Thermer / "Bluetooth Print" app.
// The app opens a deep link, then fetches the receipt JSON from /api/print-bill.
// That endpoint now needs a short-lived signed token, requested here with the user's login.
import { supabase } from './supabase'
import { guardWrite } from './shop'

export async function bluetoothPrint(bill) {
  if (!guardWrite('Printing')) return
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch('/api/print-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ id: bill.id }),
  })
  if (!r.ok) { alert('Could not start printing. Please try again.'); return }
  const { token } = await r.json()
  const apiUrl = `${window.location.origin}/api/print-bill?id=${bill.id}&t=${token}`
  window.location.href = `my.bluetoothprint.scheme://${apiUrl}`
}
