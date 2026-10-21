// Central plan configuration and feature gating.
// Limits, prices and ad slot IDs are defined here only.

export const UPGRADE_WHATSAPP = '919270243271'

export const ADS_CONFIG = {
  client: 'ca-pub-4980923603937746',
  slots: {
    billing_dashboard: '',
    billing_history: '',
    billing_reports: '',
  },
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '₹0',
    billingCycle: 'forever',
    monthlyBillLimit: 200,
    overageRate: 0.30,
    features: [
      '200 bills per month included',
      '₹0.30 per extra bill (metered overage)',
      '1 owner login',
      'Bluetooth thermal printing (58 / 80 mm)',
      'WhatsApp PDF invoices & dynamic UPI QR',
      'Repeat-last-bill & draft saving',
      'Custom receipt, bill numbering & tax settings',
    ],
    flags: {
      ads: true,
      staffLogins: false,
      customDomain: false,
      verifiedBadge: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    monthly: 29,
    yearly: 249,
    priceLabel: '₹29 / mo',
    yearlyLabel: '₹249 / year',
    monthlyBillLimit: 600,
    overageRate: 0.30,
    features: [
      'No ads anywhere',
      '600 bills per month included',
      '₹0.30 per extra bill after 600',
      '1 owner login',
      'Everything in Free (thermal printing, WhatsApp invoices, UPI QR)',
      'Custom receipt, bill numbering & tax settings',
    ],
    flags: {
      ads: false,
      staffLogins: false,
      customDomain: false,
      verifiedBadge: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthly: 199,
    priceLabel: 'From ₹199 / mo',
    monthlyBillLimit: Infinity,
    overageRate: 0,
    features: [
      'No ads anywhere',
      'Unlimited bills (no overage)',
      'Staff logins / multi-user access with roles',
      'Custom domain & verified shop badge',
      'Built to your requirements (customisations)',
      'Everything in Basic',
    ],
    flags: {
      ads: false,
      staffLogins: true,
      customDomain: true,
      verifiedBadge: true,
    },
  },
}

export const BASIC_PLAN = PLANS.basic
export const PRO_PLAN = PLANS.pro
export const FREE_PLAN = PLANS.free

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })

// ONE centralized helper to resolve shop's active plan: 'free' | 'basic' | 'pro'
export function getPlan(shop, ent) {
  // If explicitly specified on shop or entitlement
  const p = (shop?.plan || ent?.plan || '').toLowerCase()
  if (p === 'pro') return PLANS.pro
  if (p === 'basic') return PLANS.basic
  if (p === 'free') return PLANS.free

  // Backward compatibility: If shop has an active paid_until entitlement but no plan field set yet
  // Keep them on pro or basic? Spec: "Existing ₹99 Billing users keep unlimited bills until their current paid period ends"
  const now = Date.now()
  if (ent?.paid_until && new Date(ent.paid_until) > now) {
    // Existing legacy paid accounts get pro privileges (unlimited bills) until current period expires
    return PLANS.pro
  }

  // Default for new signups and users without paid plan
  return PLANS.free
}

// Check feature permission centrally: can(shop, 'ads' | 'staffLogins' | 'customDomain' | 'verifiedBadge', ent)
export function can(feature, shop, ent) {
  const plan = getPlan(shop, ent)
  if (feature in plan.flags) {
    return plan.flags[feature]
  }
  if (feature === 'monthlyBillLimit') return plan.monthlyBillLimit
  if (feature === 'overageRate') return plan.overageRate
  return false
}

export function upgradeUrl(shop, user, renew = false, planTarget = 'basic') {
  const p = planTarget.toLowerCase()
  let headline = ''
  if (p === 'pro') {
    headline = 'Hello Stellar Forge, I want to inquire about the Pro plan (unlimited bills, staff logins, custom domain).'
  } else if (renew) {
    headline = 'Hello Stellar Forge, I want to renew my Basic plan subscription.'
  } else {
    headline = 'Hello Stellar Forge, I want to upgrade to the Basic plan (₹29/month or ₹249/year: 600 bills, no ads).'
  }

  const lines = [
    headline,
    '',
    `Shop: ${shop?.name || '-'}`,
    `Mobile: ${shop?.mobile || '-'}`,
    `Email: ${user?.email || '-'}`,
    '',
    'Please share the payment / setup details.',
  ]
  return `https://wa.me/${UPGRADE_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`
}
