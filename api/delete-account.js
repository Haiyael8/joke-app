import { getSupabase, hasToken, getUserFromRequest } from '../lib/supabase.js';
import { json, authRequired } from '../lib/http.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ error: 'אפשר רק POST' }, 405);
    }
    if (!hasToken(request)) return authRequired('צריך להתחבר כדי למחוק חשבון');

    try {
      const supabase = getSupabase();
      const user = await getUserFromRequest(request, supabase);
      if (!user) return authRequired();

      // קודם מנקים את השם. ה-user_id מתאפס לבד (on delete set null) כשהמשתמש נמחק.
      const { error: clearError } = await supabase
        .from('jokes')
        .update({ author_name: null })
        .eq('user_id', user.id);
      if (clearError) throw clearError;

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;

      return json({ deleted: true });
    } catch (err) {
      console.error('delete-account failed:', err);
      return json({ error: 'לא הצלחתי למחוק את החשבון. נסו שוב.' }, 500);
    }
  },
};
