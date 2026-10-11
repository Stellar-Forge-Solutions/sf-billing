// Basic plan = one user per shop, so that user sees everything.
// Pro deployments can restrict money views by setting VITE_OWNER_EMAILS="a@x.com,b@y.com".
const LIST = (import.meta.env.VITE_OWNER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
export const OWNER_EMAILS = LIST
export const isOwner = (email) => LIST.length === 0 || LIST.includes(email?.toLowerCase())
