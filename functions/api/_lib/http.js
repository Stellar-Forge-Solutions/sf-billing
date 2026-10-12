// Small JSON response helper for Pages Functions. Everything is no-store (same as the old Vercel print endpoint).
export const json = (data, status = 200, headers = {}) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
    })