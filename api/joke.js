const INSTRUCTIONS =
  'אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה.';

const MSG_GENERIC = 'לא הצלחתי לכתוב בדיחה. נסו שוב.';
const MSG_BUSY = 'יותר מדי בקשות כרגע. נסו שוב בעוד רגע.';

function errorMessage(status, code) {
  if (status === 401) return 'יש בעיה במפתח של השרת. נסו שוב מאוחר יותר.';
  if (status === 404) return 'המודל לא נמצא. נסו שוב מאוחר יותר.';
  if (status === 429) {
    if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') {
      return 'השירות הגיע למגבלת השימוש. נסו שוב מאוחר יותר.';
    }
    return MSG_BUSY;
  }
  return MSG_GENERIC;
}

function extractText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const parts = [];
  for (const item of data.output || []) {
    if (item.type !== 'message') continue;
    for (const part of item.content || []) {
      if (part.type === 'output_text' && typeof part.text === 'string') parts.push(part.text);
    }
  }
  return parts.join('').trim();
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'אפשר רק POST' }, { status: 405 });
    }

    let topic = '';
    try {
      const body = await request.json();
      if (typeof body.topic === 'string') topic = body.topic.trim().slice(0, 100);
    } catch {
      topic = '';
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-5';
    console.log(`joke requested, topic: "${topic}", model: ${model}`);

    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing');
      return Response.json({ error: MSG_GENERIC }, { status: 500 });
    }

    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: INSTRUCTIONS,
          input: topic ? `נושא הבדיחה: ${topic}` : 'אין נושא. ספר בדיחה כללית על החיים.',
          reasoning: { effort: 'low' },
          max_output_tokens: 1500,
        }),
      });

      if (!res.ok) {
        let code = '';
        let detail = '';
        try {
          const err = await res.json();
          code = err.error?.code || '';
          detail = err.error?.message || '';
        } catch {}
        console.error(`OpenAI error: status ${res.status}, code ${code}, ${detail}`);
        return Response.json({ error: errorMessage(res.status, code) }, { status: 502 });
      }

      const data = await res.json();
      const joke = extractText(data);
      if (!joke) {
        console.error(`OpenAI returned no text, status: ${data.status}`);
        return Response.json({ error: MSG_GENERIC }, { status: 502 });
      }
      return Response.json({ joke });
    } catch (err) {
      console.error('Request to OpenAI failed:', err);
      return Response.json({ error: MSG_GENERIC }, { status: 500 });
    }
  },
};
