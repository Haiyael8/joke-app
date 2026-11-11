import { getSupabase, hasToken, getUserFromRequest } from '../lib/supabase.js';
import { json, authRequired } from '../lib/http.js';

const LIMITS = { new: 20, top: 10, liked: 50 };

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return json({ error: 'אפשר רק GET' }, 405);
    }

    const mode = new URL(request.url).searchParams.get('mode');
    if (!Object.hasOwn(LIMITS, mode)) {
      return json({ error: 'סוג רשימה לא תקין' }, 400);
    }
    if (mode === 'liked' && !hasToken(request)) {
      return authRequired('צריך להתחבר כדי לראות מה אהבת');
    }

    try {
      const supabase = getSupabase();
      let viewer = null;
      if (hasToken(request)) {
        const user = await getUserFromRequest(request, supabase);
        if (!user) return authRequired();
        viewer = user.id;
      }

      const { data, error } = await supabase.rpc('joke_feed', {
        viewer,
        mode,
        max_rows: LIMITS[mode],
      });
      if (error) throw error;

      // user_id לא מוחזר אף פעם. הפונקציה בכלל לא מחזירה אותו.
      return json({ jokes: data || [] });
    } catch (err) {
      console.error('feed failed:', err);
      return json({ error: 'לא הצלחתי לטעון את הרשימה.' }, 500);
    }
  },
};
