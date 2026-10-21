import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'

/**
 * Returns IST bounds for the current month: [monthStartUTCISO, nextMonthStartUTCISO]
 * Resets on the 1st of every month at 00:00:00 IST (+05:30)
 */
export function getISTMonthBounds(date = new Date()) {
  // Convert current instant to IST components
  const istStr = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  const istDate = new Date(istStr)
  const year = istDate.getFullYear()
  const month = istDate.getMonth() // 0-indexed

  // IST is UTC + 5h30m = 330 mins = 19800000 ms
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

  // 1st of current month at 00:00:00 IST in UTC
  const startLocalMs = Date.UTC(year, month, 1, 0, 0, 0)
  const startUtcMs = startLocalMs - IST_OFFSET_MS
  const startISO = new Date(startUtcMs).toISOString()

  // 1st of next month at 00:00:00 IST in UTC
  const nextMonthLocalMs = Date.UTC(year, month + 1, 1, 0, 0, 0)
  const nextMonthUtcMs = nextMonthLocalMs - IST_OFFSET_MS
  const endISO = new Date(nextMonthUtcMs).toISOString()

  return { startISO, endISO, year, month: month + 1 }
}

/**
 * Fetch bill count created in the current calendar month (IST).
 * Counts NEWLY CREATED bills (draft, final, cancelled) by created_at.
 * Does not count reprints, WhatsApp resends, edits or views.
 */
export async function getMonthBillCount() {
  const { startISO, endISO } = getISTMonthBounds()
  const { count, error } = await supabase
    .from('bills')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startISO)
    .lt('created_at', endISO)

  if (error) {
    console.error('Error fetching monthly bill count:', error)
    return 0
  }
  return count || 0
}

/**
 * Calculate usage metrics based on bill count and plan configuration
 */
export function calculateUsage(billCount, plan, shop) {
  const limit = plan.monthlyBillLimit
  const overageRate = plan.overageRate || 0
  const isUnlimited = limit === Infinity || limit >= 999999

  const overageLimitRupees = shop?.overage_limit_rupees !== undefined ? Number(shop.overage_limit_rupees) : 300 // default ₹300

  if (isUnlimited) {
    return {
      billCount,
      limit: Infinity,
      isUnlimited: true,
      includedUsed: billCount,
      overageBills: 0,
      overageAmount: 0,
      overageLimitRupees,
      isNearLimit: false,
      isOverLimit: false,
      isBlocked: false,
    }
  }

  const includedUsed = Math.min(billCount, limit)
  const overageBills = Math.max(0, billCount - limit)
  const overageAmount = Math.round(overageBills * overageRate * 100) / 100 // rounded to paise

  const isNearLimit = billCount >= Math.floor(limit * 0.8) && billCount < limit
  const isOverLimit = billCount >= limit

  // Blocked logic:
  // If overageLimitRupees === 0, block new bills immediately when billCount >= limit.
  // If overageLimitRupees > 0, block when overageAmount >= overageLimitRupees.
  let isBlocked = false
  if (isOverLimit) {
    if (overageLimitRupees === 0) {
      isBlocked = true
    } else if (overageAmount >= overageLimitRupees) {
      isBlocked = true
    }
  }

  return {
    billCount,
    limit,
    isUnlimited: false,
    includedUsed,
    overageBills,
    overageAmount,
    overageLimitRupees,
    isNearLimit,
    isOverLimit,
    isBlocked,
  }
}

/**
 * Hook to get the live monthly bill usage and calculate plan overage
 */
export function useMonthlyUsage(shop, plan) {
  const [billCount, setBillCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    const count = await getMonthBillCount()
    setBillCount(count)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // Listen to real-time changes on bills
    const channel = supabase
      .channel('bills-usage-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bills' }, reload)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bills' }, reload)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const usage = calculateUsage(billCount, plan, shop)

  return {
    ...usage,
    loading,
    reload,
  }
}
