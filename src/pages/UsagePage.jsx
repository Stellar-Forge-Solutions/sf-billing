import { useState, useEffect } from 'react'
import { useShop } from '../lib/ShopContext'
import { useAuth } from '../lib/AuthContext'
import { getPlan, can, upgradeUrl, fmtDate } from '../lib/plans'
import { useMonthlyUsage } from '../lib/billCounter'
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

  return (
    <div className="page" style={{ maxWidth: 800 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Renewal / Reset Date</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>
              {renewalDate ? fmtDate(renewalDate) : '1st of every month'}
            </div>
          </div>
        </div>
      </div>

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
