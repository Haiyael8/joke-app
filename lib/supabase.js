import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY is missing');
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

function tokenFrom(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : '';
}

export function hasToken(request) {
  return request.headers.has('authorization');
}

// מחזירה את המשתמש, או null אם הטוקן לא מוכר. זורקת שגיאה כש-Supabase לא זמין.
export async function getUserFromRequest(request, supabase) {
  const token = tokenFrom(request);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    const status = error.status;
    if (typeof status === 'number' && status >= 400 && status < 500) return null;
    throw error;
  }
  return data?.user || null;
}

export function displayName(user) {
  const name = user?.user_metadata?.full_name;
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().slice(0, 30).trim();
  return trimmed || null;
}
