import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { setLiveShop } from './shop'
import { getPlan } from './plans'

const Ctx = createContext({})
export const useShop = () => useContext(Ctx)

export function ShopProvider({ children }) {
  const { session } = useAuth()
  const [st, setSt] = useState({ loading: true, shop: null, ent: null, canWrite: false, plan: null })

  const load = useCallback(async () => {
    if (!session) {
      setLiveShop(null, false)
      return setSt({ loading: false, shop: null, ent: null, canWrite: false, plan: null })
    }
    const { data: shop } = await supabase.from('shops').select('*').maybeSingle()
    const { data: ent } = await supabase.from('entitlements').select('*').eq('product', 'billing').maybeSingle()

    const plan = getPlan(shop, ent)
    // In the new plan model, approved shops can write bills (subject to monthly overage limit checks).
    // The previous 15-day trial-expiry hard stop is replaced with the monthly plan limits.
    const canWrite = !!shop && shop.status === 'approved'
    setLiveShop(shop, canWrite)
    setSt({ loading: false, shop, ent, canWrite, plan })
  }, [session?.user?.id])

  useEffect(() => {
    setSt(s => ({ ...s, loading: true }))
    load()
  }, [load])

  return <Ctx.Provider value={{ ...st, reload: load }}>{children}</Ctx.Provider>
}
