import { useEffect, useRef, useState } from 'react'
import { ADS_CONFIG, can } from '../lib/plans'

/**
 * Checks client-exposed env flag.
 * Supports Vite: import.meta.env.VITE_ADS_ENABLED
 */
const IS_ADS_ENABLED =
  import.meta.env.VITE_ADS_ENABLED === 'true' ||
  import.meta.env.VITE_ADS_ENABLED === '1'

const IS_DEV = import.meta.env.DEV

let scriptLoadedOrRequested = false

function loadAdSenseScript(clientId) {
  if (scriptLoadedOrRequested) return
  if (typeof document === 'undefined') return

  // Check if already in DOM
  if (document.querySelector('script[src*="adsbygoogle.js"]')) {
    scriptLoadedOrRequested = true
    return
  }

  // Respect EU/UK consent if consent manager present (e.g. window.__cmp, window.__tcfapi)
  if (window.__tcfapi && typeof window.__tcfapi === 'function') {
    // Wait for consent or trigger non-personalized request
    window.adsbygoogle = window.adsbygoogle || []
    window.adsbygoogle.requestNonPersonalizedAds = 1
  }

  const s = document.createElement('script')
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
  s.async = true
  s.crossOrigin = 'anonymous'
  document.head.appendChild(s)
  scriptLoadedOrRequested = true
}

/**
 * AdBanner component
 * Props:
 * - slotId: AdSense slot string (e.g. ADS_CONFIG.slots.billing_dashboard)
 * - plan: active plan object ('free' | 'basic' | 'pro')
 * - hasData: boolean indicating whether page real data has loaded and is not empty
 */
export default function AdBanner({ slotId, plan, hasData = true }) {
  const containerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const adPushedRef = useRef(false)

  // 1. Ads allowed ONLY when plan allows ads (Free plan)
  const adsAllowed = plan?.id === 'free' && can('ads', null, { plan: plan.id })
  // 2. Must have valid slot ID or be dev mode
  const slotAvailable = !!slotId && slotId.trim().length > 0

  // Lazy-load with IntersectionObserver
  useEffect(() => {
    if (!adsAllowed || (!slotAvailable && !IS_DEV) || !hasData) return

    const el = containerRef.current
    if (!el) return

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true)
              observer.disconnect()
            }
          })
        },
        { rootMargin: '100px' }
      )
      observer.observe(el)
      return () => observer.disconnect()
    } else {
      setIsVisible(true)
    }
  }, [adsAllowed, slotAvailable, hasData])

  // Trigger AdSense script and push ad unit
  useEffect(() => {
    if (!isVisible || !adsAllowed || !hasData) return

    if (slotAvailable && (IS_ADS_ENABLED || !IS_DEV)) {
      loadAdSenseScript(ADS_CONFIG.client)

      if (!adPushedRef.current) {
        try {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          adPushedRef.current = true
        } catch (e) {
          console.error('AdSense push error:', e)
        }
      }
    }
  }, [isVisible, adsAllowed, slotAvailable, hasData])

  // Render nothing if ads not allowed, data not ready, or in prod build with empty slot
  if (!adsAllowed || !hasData) return null
  if (!slotAvailable && !IS_DEV) return null

  return (
    <div
      ref={containerRef}
      className="ad-container"
      style={{
        maxWidth: 728,
        width: '100%',
        margin: '32px auto',
        minHeight: 90,
        borderRadius: 4,
        background: 'transparent',
        textAlign: 'center',
        clear: 'both',
      }}
    >
      {/* Dev placeholder when slotId is missing or running locally */}
      {IS_DEV && (!slotAvailable || !IS_ADS_ENABLED) ? (
        <div
          className="ad-placeholder"
          style={{
            minHeight: 90,
            background: 'rgba(0, 0, 0, 0.05)',
            border: '1px dashed #bbb',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '0.8rem',
            padding: 12,
          }}
        >
          <span style={{ fontWeight: 600, marginBottom: 4 }}>Ad placeholder (Dev mode · Free Plan only)</span>
          <span style={{ fontSize: '0.72rem', color: '#888' }}>
            Slot: {slotId || '(No slot configured)'} | Ads will render in production when VITE_ADS_ENABLED=true and Slot ID is set.
          </span>
        </div>
      ) : slotAvailable && isVisible ? (
        <>
          <div
            className="ad-label"
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted, #888)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            Advertisement
          </div>
          <div className="ad-slot" style={{ minHeight: 90, overflow: 'hidden' }}>
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={ADS_CONFIG.client}
              data-ad-slot={slotId}
              data-ad-format="horizontal"
              data-full-width-responsive="false"
            />
          </div>
        </>
      ) : (
        <div style={{ minHeight: 90 }} />
      )}
    </div>
  )
}
