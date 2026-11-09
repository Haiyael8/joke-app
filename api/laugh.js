import { getSupabase } from '../lib/supabase.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'אפשר רק POST' }, { status: 405 });
    }

    let id = '';
    try {
      const body = await request.json();
      if (typeof body.id === 'string') id = body.id;
    } catch {
      id = '';
    }
    if (!UUID.test(id)) {
      return Response.json({ error: 'מזהה בדיחה לא תקין' }, { status: 400 });
    }

    try {
      const { data, error } = await getSupabase().rpc('add_laugh', { joke_id: id });
      if (error) throw error;
      if (typeof data !== 'number') {
        return Response.json({ error: 'הבדיחה לא נמצאה' }, { status: 404 });
      }
      return Response.json({ laughs: data });
    } catch (err) {
      console.error('add_laugh failed:', err);
      return Response.json({ error: 'לא הצלחתי לספור את הצחוק. נסו שוב.' }, { status: 500 });
    }
  },
};
