import { getSupabase } from '../lib/supabase.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'אפשר רק GET' }, { status: 405 });
    }

    try {
      const { data, error } = await getSupabase()
        .from('jokes')
        .select('id, text, laughs')
        .gte('laughs', 1)
        .order('laughs', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return Response.json({ jokes: data }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      console.error('top jokes failed:', err);
      return Response.json({ error: 'לא הצלחתי לטעון את הרשימה.' }, { status: 500 });
    }
  },
};
