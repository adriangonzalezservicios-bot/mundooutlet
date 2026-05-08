export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/meta-ai') {
      const prompt = await request.text();
      const r = await fetch('https://api.meta.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.META_AI_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: prompt, context: 'MundoOutlet' })
      });
      return new Response(await r.text());
    }

    // fallback
    return new Response('Not found', { status: 404 });
  }
};
