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

    const keyStatus = process.env.OPENAI_API_KEY ? 'נמצא' : 'חסר';
    console.log(`joke requested, topic: "${topic}", key: ${keyStatus}`);

    return Response.json({
      joke: `בדיחה זמנית מהשרת: ${topic}. המפתח: ${keyStatus}`,
    });
  },
};
