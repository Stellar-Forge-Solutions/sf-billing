import { useState, useEffect } from 'react'
import { useShop } from '../lib/ShopContext'
import { useAuth } from '../lib/AuthContext'
import { getPlan, can, upgradeUrl, fmtDate } from '../lib/plans'
import { useMonthlyUsage, getISTMonthBounds } from '../lib/billCounter'
import { billNo, billLabel } from '../lib/billUtils'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import UsageWidget from '../components/UsageWidget'

export default function UsagePage() {
  const { shop, ent, reload } = useShop()
  const { user } = useAuth()
  const toast = useToast()
  const plan = getPlan(shop, ent)
  const usage = useMonthlyUsage(shop, plan)

  const [limitInput, setLimitInput] = useState(
    shop?.overage_limit_rupees !== undefined ? String(shop.overage_limit_rupees) : '300'
  )
  const [savingLimit, setSavingLimit] = useState(false)

  // Overage entries breakdown state
  const [overageBillsList, setOverageBillsList] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [showAllMonthBills, setShowAllMonthBills] = useState(false)

  const renewalDate = ent?.paid_until || shop?.plan_renewal_date

  const handleSaveLimit = async () => {
    const val = Number(limitInput)
    if (isNaN(val) || val < 0) {
      return toast('Please enter a valid amount (0 or more)', 'error')
    }
    setSavingLimit(true)
    const { error } = await supabase.from('shops').update({ overage_limit_rupees: val }).eq('id', shop.id)
    setSavingLimit(false)
    if (error) {
      toast('Failed to save overage limit: ' + error.message, 'error')
    } else {
      toast('Overage limit updated to ₹' + val)
      reload()
    }
  }

  // Fetch all bills created this month in chronological order to identify overage bills
  useEffect(() => {
    if (plan.monthlyBillLimit === Infinity) return

    async function loadMonthlyEntries() {
      setLoadingEntries(true)
      const { startISO, endISO } = getISTMonthBounds()
      const { data, error } = await supabase
        .from('bills')
        .select('id, bill_no, customer_name, total_amount, status, created_at, billing_date')
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: true }) // First created to last created

      setLoadingEntries(false)
      if (!error && data) {
        setOverageBillsList(data)
      }
    }

    loadMonthlyEntries()
  }, [plan.monthlyBillLimit, usage.billCount])

  // Split month bills into included vs overage
  const includedCount = plan.monthlyBillLimit || 0
  const includedBills = overageBillsList.slice(0, includedCount)
  const overageEntries = overageBillsList.slice(includedCount)

  return (
    <div className="page" style={{ maxWidth: 840 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Usage & Billing</h1>
          <p className="page-subtitle">Track your monthly bills, limits, and plan overage.</p>
        </div>
      </div>

      <UsageWidget usage={usage} />

      {/* Plan Details Card */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px' }}>Subscription Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Plan</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>{plan.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Included Monthly Bills</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>
              {plan.monthlyBillLimit === Infinity ? 'Unlimited' : plan.monthlyBillLimit}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Extra Bill Rate</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>
              {plan.overageRate ? `₹${plan.overageRate.toFixed(2)} / bill` : 'None (Unlimited)'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reset Date</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>
              {renewalDate ? fmtDate(renewalDate) : '1st of every month'}
            </div>
          </div>
        </div>
      </div>

      {/* Overage Entries & Charges Breakdown Section */}
      {plan.id !== 'pro' && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0 }}>Overage Entries & Charges</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Detailed ledger of bills created past your {plan.monthlyBillLimit} included monthly allowance.
              </p>
            </div>
            {overageEntries.length > 0 && (
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#b45309',
                  padding: '4px 12px',
                  borderRadius: 99,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                Accrued: ₹{(overageEntries.length * 0.30).toFixed(2)}
              </span>
            )}
          </div>

          {loadingEntries ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading monthly entries…
            </div>
          ) : overageEntries.length === 0 ? (
            <div
              style={{
                background: 'var(--paper)',
                padding: '20px 16px',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🌱</div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>No overage charges this month</div>
              <div style={{ marginTop: 2 }}>
                You have used <b>{includedBills.length}</b> of <b>{plan.monthlyBillLimit}</b> included bills.
                Overage entries will appear here once you exceed {plan.monthlyBillLimit} bills.
              </div>
            </div>
          ) : (
            <div>
              {/* Overage summary card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 10,
                  background: 'var(--paper)',
                  padding: 12,
                  borderRadius: 'var(--radius)',
                  marginBottom: 16,
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Included bills:</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>{includedCount} / {includedCount}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Extra bills:</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2, color: 'var(--warning)' }}>+{overageEntries.length}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Rate per bill:</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>₹0.30</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total accrued:</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2, color: 'var(--teal-dark)' }}>
                    ₹{(overageEntries.length * 0.30).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Table of overage bills */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>#</th>
                      <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Bill No</th>
                      <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Customer</th>
                      <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Date & Time</th>
                      <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>Bill Amt</th>
                      <th style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'right' }}>Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllMonthBills ? overageBillsList : overageEntries).map((b, idx) => {
                      const absoluteIdx = showAllMonthBills ? idx + 1 : includedCount + idx + 1
                      const isOverage = absoluteIdx > includedCount
                      return (
                        <tr
                          key={b.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: isOverage ? 'rgba(245, 158, 11, 0.03)' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                            {absoluteIdx}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                            {billNo(b)}
                          </td>
                          <td style={{ padding: '8px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.customer_name}
                          </td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                            {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                            {new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                            ₹{Number(b.total_amount).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: isOverage ? '#b45309' : 'var(--teal-dark)' }}>
                            {isOverage ? '+₹0.30' : 'Included'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Showing {showAllMonthBills ? `all ${overageBillsList.length} bills` : `${overageEntries.length} overage bills`}
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                  onClick={() => setShowAllMonthBills(!showAllMonthBills)}
                >
                  {showAllMonthBills ? 'Show overage bills only' : 'View all bills from 1st of month'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overage Limit Setting */}
      {plan.id !== 'pro' && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>Monthly Overage Limit</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Set a maximum overage cap in ₹ for extra bills beyond your monthly allowance. Default is ₹300.
            Setting this to <b>₹0</b> blocks new bill creation immediately once your {plan.monthlyBillLimit} included bills are used.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360 }}>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                min="0"
                step="50"
                className="form-input"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                placeholder="300"
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveLimit} disabled={savingLimit}>
              {savingLimit ? 'Saving…' : 'Save Limit'}
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Current overage: {usage.overageBills} extra bills = ₹{usage.overageAmount.toFixed(2)}
          </div>
        </div>
      )}

      {/* Plans Comparison */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 16px' }}>Available Plans</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* Free */}
          <div
            style={{
              border: plan.id === 'free' ? '2px solid var(--teal)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 16,
              background: plan.id === 'free' ? 'rgba(0, 201, 167, 0.04)' : '#fff',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Free</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 10px' }}>₹0</div>
            <ul style={{ paddingLeft: 16, fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <li>200 bills / month</li>
              <li>₹0.30/bill overage</li>
              <li>Banner ads</li>
              <li>1 owner login</li>
              <li>Thermal printing & WhatsApp PDF</li>
              <li>Custom receipt & numbering</li>
            </ul>
          </div>

          {/* Basic */}
          <div
            style={{
              border: plan.id === 'basic' ? '2px solid var(--teal)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 16,
              background: plan.id === 'basic' ? 'rgba(0, 201, 167, 0.04)' : '#fff',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Basic</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 10px' }}>
              ₹29 <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ mo</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>or ₹249 / year</div>
            <ul style={{ paddingLeft: 16, fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <li>No ads anywhere</li>
              <li>600 bills / month</li>
              <li>₹0.30/bill overage</li>
              <li>1 owner login</li>
              <li>Everything in Free</li>
            </ul>
            {plan.id !== 'basic' && (
              <a
                href={upgradeUrl(shop, user, false, 'basic')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm btn-full"
                style={{ textDecoration: 'none', marginTop: 12 }}
              >
                Upgrade to Basic
              </a>
            )}
          </div>

          {/* Pro */}
          <div
            style={{
              border: plan.id === 'pro' ? '2px solid var(--teal)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 16,
              background: plan.id === 'pro' ? 'rgba(0, 201, 167, 0.04)' : '#fff',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Pro</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 10px' }}>
              From ₹199 <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ mo</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Customised per shop</div>
            <ul style={{ paddingLeft: 16, fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              <li>No ads</li>
              <li>Unlimited bills</li>
              <li>Multi-user staff logins & roles</li>
              <li>Custom domain & verified badge</li>
              <li>Built to your requirements</li>
            </ul>
            {plan.id !== 'pro' && (
              <a
                href={upgradeUrl(shop, user, false, 'pro')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark btn-sm btn-full"
                style={{ textDecoration: 'none', marginTop: 12 }}
              >
                Contact for Pro
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
