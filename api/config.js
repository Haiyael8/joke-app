import { json } from '../lib/http.js';

function isSecretKey(key) {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      return payload.role === 'service_role';
    } catch {}
  }
  return false;
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return json({ error: 'אפשר רק GET' }, 405);
    }
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      console.error('config: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing');
      return json({ error: 'הכניסה לא מוגדרת כרגע', code: 'auth_not_configured' }, 500);
    }
    if (isSecretKey(publishableKey)) {
      console.error('config: SUPABASE_PUBLISHABLE_KEY holds a secret key. Refusing to return it');
      return json({ error: 'הכניסה לא מוגדרת כרגע', code: 'auth_not_configured' }, 500);
    }
    return json({ url, publishableKey });
  },
};
