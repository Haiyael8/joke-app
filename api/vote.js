import { getSupabase, hasToken, getUserFromRequest } from '../lib/supabase.js';
import { json, authRequired, readJson } from '../lib/http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ error: 'אפשר רק POST' }, 405);
    }
    if (!hasToken(request)) return authRequired('צריך להתחבר כדי לדרג');

    let id;
    let value;
    try {
      const body = await readJson(request);
      id = body.id;
      value = body.value;
    } catch {
      return json({ error: 'הבקשה לא תקינה' }, 400);
    }
    if (typeof id !== 'string' || !UUID.test(id)) {
      return json({ error: 'מזהה בדיחה לא תקין' }, 400);
    }
    if (typeof value !== 'number' || ![1, -1, 0].includes(value)) {
      return json({ error: 'ערך הצבעה לא תקין' }, 400);
    }

    try {
      const supabase = getSupabase();
      // המשתמש מזוהה רק לפי הטוקן. מזהה משתמש מהגוף לא נחשב.
      const user = await getUserFromRequest(request, supabase);
      if (!user) return authRequired();

      const { data, error } = await supabase.rpc('cast_vote', {
        voter: user.id,
        target: id,
        new_value: value,
      });
      if (error) {
        if (error.code === 'P0002') return json({ error: 'הבדיחה לא נמצאה' }, 404);
        if (error.code === '22023') return json({ error: 'ערך הצבעה לא תקין' }, 400);
        throw error;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error('cast_vote returned no row');
      return json({ likes: row.likes, dislikes: row.dislikes, my_vote: row.my_vote });
    } catch (err) {
      console.error('vote failed:', err);
      return json({ error: 'לא הצלחתי לשמור את ההצבעה. נסו שוב.' }, 500);
    }
  },
};
