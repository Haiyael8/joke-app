// כל הכניסה בדפדפן. הספרייה של Supabase משמשת כאן לכניסה בלבד (/auth/v1).
// הכתובת והמפתח הציבורי מגיעים מ-/api/config. אין כאן אף מפתח סודי.
(function () {
  let client = null;
  let current = null;
  let readyPromise = null;
  const listeners = [];

  function messageFor(error) {
    const code = error && error.code;
    const msg = String((error && error.message) || '').toLowerCase();
    if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'המייל או הסיסמה לא נכונים';
    if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) {
      return 'המייל הזה כבר רשום. נסו להיכנס';
    }
    if (code === 'weak_password' || msg.includes('at least 6') || msg.includes('password should')) {
      return 'הסיסמה קצרה מדי. צריך 6 תווים לפחות';
    }
    if (code === 'validation_failed' || code === 'email_address_invalid' || msg.includes('invalid format') || msg.includes('invalid email')) {
      return 'כתובת המייל לא תקינה';
    }
    if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || (error && error.status === 429)) {
      return 'יותר מדי ניסיונות. נסו שוב בעוד רגע';
    }
    if (code === 'signup_disabled') return 'ההרשמה סגורה כרגע';
    if (error && (error.name === 'AuthRetryableFetchError' || msg.includes('failed to fetch'))) {
      return 'אין חיבור כרגע. נסו שוב';
    }
    return 'משהו השתבש. נסו שוב';
  }

  function fail(error) {
    const e = new Error(messageFor(error));
    e.hebrew = true;
    return e;
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = (async () => {
        const res = await fetch('/api/config');
        const cfg = await res.json();
        if (!res.ok || !cfg.url || !cfg.publishableKey) throw new Error('auth not configured');
        client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
          auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        const { data } = await client.auth.getSession();
        current = data.session || null;
        client.auth.onAuthStateChange((_event, session) => {
          current = session || null;
          listeners.forEach((fn) => fn(current));
        });
        return current;
      })();
      readyPromise.catch(() => { readyPromise = null; });
    }
    return readyPromise;
  }

  async function signUp(name, email, password) {
    await ready();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: String(name).trim().slice(0, 30) } },
    });
    if (error) throw fail(error);
    if (!data.session) throw fail({ message: 'confirm' });
    return data.session;
  }

  async function signIn(email, password) {
    await ready();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw fail(error);
    return data.session;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut({ scope: 'local' });
  }

  window.Auth = {
    ready,
    signUp,
    signIn,
    signOut,
    session: () => current,
    token: () => (current ? current.access_token : null),
    onChange: (fn) => { listeners.push(fn); },
  };
})();
