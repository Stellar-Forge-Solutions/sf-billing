# sf-billing — Stellar Forge Billing (multi-shop)
Same screens and flow as the original billing app, plus: self-signup with admin review, 15-day trial, shop Settings
(name, tagline, address, mobile, WhatsApp, logo, GST, UPI id + QR, website, thank-you text, bill prefix, 58/80 mm paper),
per-shop bill numbers, secured Thermer printing, view-only after trial, Stellar Forge branding.

## Deploy
1. Deploy the **sf-admin-dash** repo first: it owns the database migrations (0001, 0002) and the DB workflow.
2. Push this folder to its own GitHub repo -> Vercel -> Add New Project -> import (Vite). Add env vars from `.env.example`.
3. Supabase -> Authentication -> Providers -> Email: turn OFF "Allow new users to sign up" (signup goes through /api/signup)
   and set the Site URL to your Vercel URL.
4. Password-reset emails still use Supabase's built-in mail until you set a custom SMTP in Supabase.
Printing: keep using the Thermer app; Settings -> paper width (58/80 mm) controls the receipt layout.
