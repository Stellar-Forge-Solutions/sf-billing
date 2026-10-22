import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LoginShowcase from '../components/LoginShowcase'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'forgot_email' | 'forgot_otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown(c => c - 1)
    }, 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const handleSignIn = async () => {
    setError('')
    setSuccess('')
    if (!email.trim()) return setError('Please enter your email')
    if (!password) return setError('Please enter your password')

    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (err) setError(err.message)
  }

  const handleSendOtp = async () => {
    setError('')
    setSuccess('')
    if (!email.trim() || !email.includes('@')) {
      return setError('Please enter a valid email address')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        setError(data.error || 'Failed to send reset code.')
      } else {
        setSuccess('6-digit reset code sent to your email!')
        setMode('forgot_otp')
        setResendCooldown(60)
      }
    } catch (err) {
      setLoading(false)
      setError('Network error. Please try again.')
    }
  }

  const handleVerifyOtpAndReset = async () => {
    setError('')
    setSuccess('')
    if (!otp.trim() || otp.trim().length !== 6) {
      return setError('Please enter the 6-digit OTP code')
    }
    if (!newPassword || newPassword.length < 8) {
      return setError('Password must be at least 8 characters long')
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.')
      } else {
        setSuccess('Password updated successfully! Please sign in with your new password.')
        setPassword(newPassword)
        setMode('login')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setLoading(false)
      setError('Network error. Please try again.')
    }
  }

  const darkInput = {
    background: 'rgba(255,255,255,0.07)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    color: 'var(--white)',
  }

  return (
    <div className="sf-login">
      <div className="sf-glow" style={{ width: 520, height: 520, left: -120, top: -60 }} />
      <div className="sf-glow" style={{ width: 460, height: 460, right: -100, bottom: 40, animationDelay: '-5s' }} />

      {/* Left / top: brand + animated benefits */}
      <section className="sf-hero">
        <img src="/sf-mark-light.png" alt="" style={{ width: 56 }} />
        <div style={{ color: 'var(--white)', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.3em', marginTop: 8 }}>STELLAR FORGE</div>
        <div style={{ color: 'var(--teal)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.25em', marginTop: 4 }}>BILLING</div>
        <div className="sf-badge" style={{ marginTop: 18 }}>Start free · 200 bills/mo included · No card needed</div>
        <LoginShowcase />
      </section>

      {/* Right / bottom: free plan first, sign in second */}
      <section className="sf-panel">
        <Link to="/signup" className="sf-cta">Start free · 200 bills/month included →</Link>
        <p className="sf-note">We review every new shop within 1 hour (9 am – 9 pm IST) and message you on WhatsApp. Your account is ready when approved.</p>
        <div className="sf-or">Already have an account?</div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '380px',
          backdropFilter: 'blur(12px)',
        }}>
          {mode === 'login' && (
            <>
              {/* Email */}
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.45)' }}>Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  style={darkInput}
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.45)' }}>Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                  style={darkInput}
                />
              </div>

              {/* Error / success */}
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✕ {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(0,201,167,0.12)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px', padding: '10px 14px', color: 'var(--teal)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✓ {success}
                </div>
              )}

              {/* Submit */}
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSignIn}
                disabled={loading}
                style={{ marginBottom: '16px' }}
              >
                {loading ? '⏳ Signing in…' : 'Sign In →'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => { setMode('forgot_email'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem' }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {mode === 'forgot_email' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Reset Password</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  Enter your registered email and we will send a 6-digit OTP code to reset your password.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.45)' }}>Account Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  style={darkInput}
                  autoFocus
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✕ {error}
                </div>
              )}

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ marginBottom: '16px' }}
              >
                {loading ? '⏳ Sending code…' : 'Send 6-Digit Code →'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem' }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}

          {mode === 'forgot_otp' && (
            <>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Enter Code & New Password</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Code sent to <b>{email}</b>. Check your inbox.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.45)' }}>6-Digit OTP Code</label>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ ...darkInput, letterSpacing: '0.3em', fontSize: '1.3rem', textAlign: 'center', fontFamily: 'monospace' }}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.45)' }}>New Password (8+ chars)</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={darkInput}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.45)' }}>Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtpAndReset()}
                  style={darkInput}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✕ {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(0,201,167,0.12)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: '8px', padding: '10px 14px', color: 'var(--teal)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ✓ {success}
                </div>
              )}

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleVerifyOtpAndReset}
                disabled={loading}
                style={{ marginBottom: '14px' }}
              >
                {loading ? '⏳ Updating password…' : 'Reset Password →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
                >
                  ← Sign In
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'rgba(255,255,255,0.3)' : 'var(--teal)',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.78rem',
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textAlign: 'center' }}>
          Powered by Stellar Forge
        </div>
      </section>
    </div>
  )
}
