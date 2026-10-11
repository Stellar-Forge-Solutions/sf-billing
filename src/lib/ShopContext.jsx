import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { setLiveShop } from './shop'

const Ctx = createContext({})
export const useShop = () => useContext(Ctx)

export function ShopProvider({ children }) {
  const { session } = useAuth()
  const [st, setSt] = useState({ loading: true, shop: null, ent: null, canWrite: false })

  const load = useCallback(async () => {
    if (!session) { setLiveShop(null, false); return setSt({ loading: false, shop: null, ent: null, canWrite: false }) }
    const { data: shop } = await supabase.from('shops').select('*').maybeSingle()
    const { data: ent } = await supabase.from('entitlements').select('*').eq('product', 'billing').maybeSingle()
    const now = Date.now()
    const active = !!ent && ((ent.trial_ends_at && new Date(ent.trial_ends_at) > now) || (ent.paid_until && new Date(ent.paid_until) > now))
    const canWrite = !!shop && shop.status === 'approved' && active
    setLiveShop(shop, canWrite)
    setSt({ loading: false, shop, ent, canWrite })
  }, [session?.user?.id])

  useEffect(() => { setSt(s => ({ ...s, loading: true })); load() }, [load])
  return <Ctx.Provider value={{ ...st, reload: load }}>{children}</Ctx.Provider>
}
