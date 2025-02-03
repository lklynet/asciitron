// KV Namespace binding will be named SCORES

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 30; // max requests per window

    if (this.requests.has(ip)) {
      const requests = this.requests.get(ip).filter(time => now - time < windowMs);
      if (requests.length >= maxRequests) return true;
      requests.push(now);
      this.requests.set(ip, requests);
    } else {
      this.requests.set(ip, [now]);
    }
    return false;
  }
}

const rateLimiter = new RateLimiter();

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP');
  if (rateLimiter.isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const apiKey = request.headers.get('Authorization');
  if (!apiKey || apiKey !== `Bearer ${API_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);

  try {
    if (request.method === 'GET' && url.pathname === '/scores') {
      const scores = await SCORES.get('highscores', 'json') || [];
      return new Response(JSON.stringify(scores.sort((a, b) => b.score - a.score).slice(0, 10)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST' && url.pathname === '/scores') {
      const { score } = await request.json();
      if (typeof score !== 'number' || score < 0) {
        throw new Error('Invalid score');
      }

      const scores = await SCORES.get('highscores', 'json') || [];
      scores.push({
        score,
        timestamp: Date.now()
      });

      await SCORES.put('highscores', JSON.stringify(
        scores.sort((a, b) => b.score - a.score).slice(0, 100)
      ));

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});