import { useState } from 'react'
import { getPlan, can, upgradeUrl } from '../lib/plans'
import { useShop } from '../lib/ShopContext'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'

export default function UsageWidget({ usage, onUpgradeClick }) {
  const { shop, ent, reload } = useShop()
  const toast = useToast()
  const plan = getPlan(shop, ent)
  const [editingLimit, setEditingLimit] = useState(false)
  const [limitInput, setLimitInput] = useState(shop?.overage_limit_rupees !== undefined ? String(shop.overage_limit_rupees) : '300')
  const [savingLimit, setSavingLimit] = useState(false)

  if (!usage) return null
  const {
    billCount,
    limit,
    isUnlimited,
    includedUsed,
    overageBills,
    overageAmount,
    overageLimitRupees,
    isNearLimit,
    isOverLimit,
    isBlocked,
  } = usage

  const pct = isUnlimited ? 100 : Math.min(100, Math.round((includedUsed / limit) * 100))

  const handleSaveLimit = async () => {
    const val = Number(limitInput)
    if (isNaN(val) || val < 0) {
      toast('Please enter a valid amount (0 or more)', 'error')
      return
    }
    setSavingLimit(true)
    const { error } = await supabase.from('shops').update({ overage_limit_rupees: val }).eq('id', shop.id)
    setSavingLimit(false)
    if (error) {
      toast('Failed to save overage limit: ' + error.message, 'error')
    } else {
      toast('Overage limit updated to ₹' + val)
      setEditingLimit(false)
      reload()
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        marginBottom: 20,
        background: isBlocked ? '#fff5f5' : isOverLimit ? '#fffdf0' : '#ffffff',
        border: `1px solid ${isBlocked ? '#fca5a5' : isOverLimit ? '#fde047' : 'var(--border)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Monthly Usage · {plan.name} Plan
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
            {isUnlimited ? (
              <span>{billCount} bills created this month (Unlimited)</span>
            ) : (
              <span>
                {includedUsed} of {limit} bills used this month
              </span>
            )}
          </div>
        </div>

        {/* Upgrade / Contact action */}
        {plan.id !== 'pro' && (
          <a
            href={upgradeUrl(shop, null, false, plan.id === 'free' ? 'basic' : 'pro')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
            style={{ textDecoration: 'none' }}
            onClick={onUpgradeClick}
          >
            {plan.id === 'free' ? '⭐ Upgrade to Basic (₹29/mo)' : '👑 Upgrade to Pro'}
          </a>
        )}
      </div>

      {/* Progress bar for limited plans */}
      {!isUnlimited && (
        <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: isBlocked ? 'var(--danger)' : isOverLimit ? 'var(--warning)' : 'var(--teal)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* Near limit (>= 80%) non-blocking notice */}
      {isNearLimit && !isOverLimit && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#b45309',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.825rem',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span>
            ⚠️ You've used {Math.round((includedUsed / limit) * 100)}% of your monthly included bills ({includedUsed}/{limit}).
          </span>
          <a
            href={upgradeUrl(shop, null, false, 'basic')}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 700, color: '#b45309', textDecoration: 'underline' }}
          >
            Upgrade to Basic for 600 bills
          </a>
        </div>
      )}

      {/* Over limit notice & overage tracking */}
      {isOverLimit && (
        <div
          style={{
            background: isBlocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.12)',
            color: isBlocked ? '#b91c1c' : '#92400e',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginTop: 8,
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {isBlocked
              ? '⛔ Monthly limit reached: new bill creation is blocked until next month or limit increase.'
              : `⚡ Over included limit: ${overageBills} extra bill${overageBills === 1 ? '' : 's'} (₹${overageAmount.toFixed(2)} accrued at ₹0.30/bill).`}
          </div>
          <div style={{ fontSize: '0.78rem', marginTop: 4, opacity: 0.9 }}>
            Existing bills, drafts, reprints and WhatsApp sharing remain 100% accessible.
          </div>
        </div>
      )}

      {/* Overage stats & settings toggle */}
      {!isUnlimited && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px dashed var(--border)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            Extra bills: <b style={{ color: 'var(--ink)' }}>{overageBills}</b> · Extra charge:{' '}
            <b style={{ color: 'var(--ink)' }}>₹{overageAmount.toFixed(2)}</b> · Overage cap:{' '}
            <b style={{ color: 'var(--ink)' }}>{overageLimitRupees === 0 ? '₹0 (Hard block)' : `₹${overageLimitRupees}`}</b>
          </div>

          <div>
            {editingLimit ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem' }}>Cap (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  style={{ width: 70, padding: '2px 6px', fontSize: '0.8rem', border: '1px solid var(--border)', borderRadius: 4 }}
                />
                <button className="btn btn-sm btn-primary" onClick={handleSaveLimit} disabled={savingLimit}>
                  Save
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setEditingLimit(false)}>
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm btn-ghost"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                onClick={() => setEditingLimit(true)}
              >
                ⚙️ Adjust cap
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1,000+ bills hint */}
      {billCount >= 1000 && plan.id !== 'pro' && (
        <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--teal-dark)', fontWeight: 600 }}>
          💡 Doing 1,000+ bills a month? Pro is unlimited bills with multi-user staff logins.
        </div>
      )}
    </div>
  )
}
