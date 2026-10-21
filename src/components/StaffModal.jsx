import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useShop } from '../lib/ShopContext'
import { useToast } from '../components/Toast'
import { can, upgradeUrl } from '../lib/plans'

export default function StaffModal({ onClose }) {
  const { shop, ent, reload } = useShop()
  const toast = useToast()
  const hasStaff = can('staffLogins', shop, ent)

  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('cashier') // cashier | manager
  const [busy, setBusy] = useState(false)

  const fetchStaff = async () => {
    if (!shop?.id) return
    const { data, error } = await supabase.from('shop_staff').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false })
    if (!error && data) setStaffList(data)
    setLoading(false)
  }

  useEffect(() => {
    if (hasStaff) fetchStaff()
    else setLoading(false)
  }, [hasStaff, shop?.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!email.trim() && !phone.trim()) return toast('Enter staff email or phone', 'error')
    setBusy(true)
    const { error } = await supabase.from('shop_staff').insert({
      shop_id: shop.id,
      email: email.trim().toLowerCase() || null,
      phone: phone.trim() || null,
      role,
    })
    setBusy(false)
    if (error) {
      toast('Failed to add staff: ' + error.message, 'error')
    } else {
      toast('Staff member invited')
      setEmail('')
      setPhone('')
      fetchStaff()
    }
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this staff member?')) return
    const { error } = await supabase.from('shop_staff').delete().eq('id', id)
    if (error) toast('Failed to remove: ' + error.message, 'error')
    else {
      toast('Staff removed')
      fetchStaff()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>👥 Staff Logins</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        {!hasStaff ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>👑</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>Pro Plan Feature</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Multi-user access with Cashier and Manager roles is available on the Pro plan. Staff can create bills and print, but cannot access shop settings or delete data.
            </p>
            <a
              href={upgradeUrl(shop, null, false, 'pro')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-full"
              style={{ textDecoration: 'none' }}
            >
              💬 Contact us on WhatsApp for Pro
            </a>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Invite staff to access your billing system. Cashiers can create bills and print; Managers also have access to history, customers and reports.
            </p>

            <form onSubmit={handleAdd} style={{ background: 'var(--paper)', padding: 12, borderRadius: 'var(--radius)', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="tel"
                  className="form-input"
                  placeholder="or phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: 120 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
                <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                  {busy ? 'Inviting…' : '+ Invite Staff'}
                </button>
              </div>
            </form>

            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading staff…</div>
              ) : staffList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No staff members added yet.</div>
              ) : (
                staffList.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.email || s.phone}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        Role: {s.role}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleRemove(s.id)}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
