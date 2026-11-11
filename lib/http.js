// עזרי תשובה וקריאת גוף. התשובות תלויות במי ששואל, ולכן no-store.

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function authRequired(message = 'צריך להתחבר שוב') {
  return json({ error: message, code: 'auth_required' }, 401);
}

export async function readJson(request, maxBytes = 2000) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error('body too large');
  return JSON.parse(raw);
}
