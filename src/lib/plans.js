// Plan details and the "Upgrade" WhatsApp link. Change prices / number here only.
export const UPGRADE_WHATSAPP = '919270243271'

export const BASIC_PLAN = {
  name: 'Basic',
  monthly: 99,
  yearly: 799,
  features: [
    'Unlimited bills',
    'Bluetooth thermal printing (58 / 80 mm)',
    'WhatsApp PDF bills and UPI QR',
    'Dashboard, reports and Excel export',
  ],
}

export const PRO_PLAN = {
  name: 'Pro',
  monthly: 199,
  yearly: 1599,
  features: [
    'Everything in Basic',
    'Staff logins for your helpers',
    'Staff cannot see your sales totals, daily earnings or reports',
    'Staff cannot export data or cancel bills: only you can',
    'Sales by staff and who created each bill',
    'Priority WhatsApp support',
  ],
}

const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
export const fmtDate = fmt

// Where is this shop in its plan? paid | trial | ended
export function planState(ent) {
  const now = Date.now()
  if (ent?.paid_until && new Date(ent.paid_until) > now) {
    return { kind: 'paid', until: ent.paid_until, days: Math.ceil((new Date(ent.paid_until) - now) / 864e5) }
  }
  if (ent?.trial_ends_at && new Date(ent.trial_ends_at) > now) {
    return { kind: 'trial', until: ent.trial_ends_at, days: Math.ceil((new Date(ent.trial_ends_at) - now) / 864e5) }
  }
  return { kind: 'ended', until: ent?.paid_until || ent?.trial_ends_at || null, days: 0 }
}

// Opens WhatsApp with a ready message asking for the monthly Basic subscription
// (or, with plan = 'pro', asking about the Pro plan).
export function upgradeUrl(shop, user, renew = false, plan = 'basic') {
  const lines = [
    plan === 'pro' ? 'Hello Stellar Forge, I want to know more about / upgrade to the Pro plan (staff logins, Rs. ' + PRO_PLAN.monthly + '/month).'
    : renew ? 'Hello Stellar Forge, I want to renew my Basic plan (monthly subscription).'
          : 'Hello Stellar Forge, I want to upgrade to the Basic plan (monthly subscription, Rs. ' + BASIC_PLAN.monthly + '/month).',
    '',
    `Shop: ${shop?.name || '-'}`,
    `Mobile: ${shop?.mobile || '-'}`,
    `Email: ${user?.email || '-'}`,
    '',
    'Please share the payment details and activate my account.',
  ]
  return `https://wa.me/${UPGRADE_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`
}
