import { useShop } from '../lib/ShopContext'
import { useAuth } from '../lib/AuthContext'
import { getPlan, can, upgradeUrl, fmtDate } from '../lib/plans'

// Shows the current plan (Free / Basic / Pro) with details and WhatsApp action buttons
export default function PlanCard({ compact = false }) {
  const { shop, ent } = useShop()
  const { user } = useAuth()
  if (!shop || shop.status !== 'approved') return null

  const plan = getPlan(shop, ent)
  const isPaid = plan.id === 'basic' || plan.id === 'pro'
  const renewalDate = ent?.paid_until || shop?.plan_renewal_date

  const badge =
    plan.id === 'pro'
      ? { text: '👑 Pro Plan Active', bg: 'var(--ink)', color: '#fff' }
      : plan.id === 'basic'
      ? { text: '⭐ Basic Plan Active', bg: 'var(--teal-glow)', color: 'var(--teal-dark)' }
      : { text: 'Free Plan · 200 bills/mo', bg: '#f1f5f9', color: '#475569' }

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        textAlign: 'left',
        ...(compact ? { width: '100%', maxWidth: 360, padding: 16 } : {}),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, borderRadius: 99, padding: '3px 10px', background: badge.bg, color: badge.color }}>
          {badge.text}
        </span>
        {renewalDate && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Renews on {fmtDate(renewalDate)}
          </span>
        )}
      </div>

      {/* Free Plan */}
      {plan.id === 'free' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? '1.3rem' : '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>₹0</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month · Free plan</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            200 bills included monthly · ₹0.30/bill after limit
          </div>
          {!compact && (
            <ul style={{ paddingLeft: 18, margin: '0 0 12px', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <li>200 bills per month included</li>
              <li>₹0.30 per extra bill (metered overage)</li>
              <li>Bluetooth thermal printing (58mm / 80mm)</li>
              <li>WhatsApp PDF invoices & UPI QR</li>
              <li>Custom receipt, bill numbering & tax settings</li>
            </ul>
          )}
          <a
            className="btn btn-primary btn-full"
            style={{ textDecoration: 'none' }}
            href={upgradeUrl(shop, user, false, 'basic')}
            target="_blank"
            rel="noopener noreferrer"
          >
            ⭐ Upgrade to Basic (₹29/mo)
          </a>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            600 bills/month · No ads · Instant WhatsApp setup
          </div>
        </>
      )}

      {/* Basic Plan */}
      {plan.id === 'basic' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? '1.3rem' : '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>₹29</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month · Basic plan</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            or ₹249 / year · 600 bills/month · No ads
          </div>
          {!compact && (
            <ul style={{ paddingLeft: 18, margin: '0 0 12px', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <li>No ads anywhere</li>
              <li>600 bills per month included</li>
              <li>₹0.30 per extra bill after 600</li>
              <li>Bluetooth thermal printing & WhatsApp PDF</li>
              <li>Custom receipt, bill numbering & tax settings</li>
            </ul>
          )}
          <a
            className="btn btn-secondary btn-full"
            style={{ textDecoration: 'none' }}
            href={upgradeUrl(shop, user, true, 'basic')}
            target="_blank"
            rel="noopener noreferrer"
          >
            🔄 Renew Basic Plan on WhatsApp
          </a>
        </>
      )}

      {/* Pro Plan */}
      {plan.id === 'pro' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? '1.3rem' : '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>Pro</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>· Unlimited bills</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            No ads · Multi-user staff logins · Custom shop domain
          </div>
          {shop?.pro_notes && (
            <div style={{ fontSize: '0.75rem', background: 'rgba(0, 201, 167, 0.1)', padding: '6px 10px', borderRadius: 6, marginBottom: 10 }}>
              <b>Shop customisation:</b> {shop.pro_notes}
            </div>
          )}
          <a
            className="btn btn-dark btn-full"
            style={{ textDecoration: 'none' }}
            href={upgradeUrl(shop, user, false, 'pro')}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Contact support for Pro
          </a>
        </>
      )}

      {/* Show Pro upgrade hint if on Basic or Free */}
      {plan.id !== 'pro' && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--ink)', color: 'var(--white)', borderRadius: 99, padding: '2px 9px' }}>
              PRO
            </span>
            <span style={{ fontSize: compact ? '1.05rem' : '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>From ₹199</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ month</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>
            Unlimited bills, multi-user staff logins with cashier roles, custom domain & verified badge.
          </div>
          <a
            className="btn btn-dark btn-full btn-sm"
            style={{ textDecoration: 'none' }}
            href={upgradeUrl(shop, user, false, 'pro')}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Ask about Pro Plan
          </a>
        </div>
      )}
    </div>
  )
}
