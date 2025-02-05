const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

const hashChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

function generateHash(input, username) {
  // Combine username and input to create a unique hash
  const combinedInput = username + "#" + input;
  let result = "";
  // Use the combined input to generate a more unique hash
  for (let i = 0; i < 6; i++) {
    const charIndex =
      (combinedInput.charCodeAt(i % combinedInput.length) +
        input.charCodeAt(i % input.length)) %
      hashChars.length;
    result += hashChars[charIndex];
  }
  return result;
}

class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 30; // max requests per window

    if (this.requests.has(ip)) {
      const requests = this.requests
        .get(ip)
        .filter((time) => now - time < windowMs);
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

async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  const clientIp = request.headers.get("CF-Connecting-IP");
  if (rateLimiter.isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);

  try {
    if (request.method === "GET" && url.pathname === "/scores") {
      const scores = (await env.SCORES.get("highscores", "json")) || [];
      return new Response(
        JSON.stringify(scores.sort((a, b) => b.score - a.score).slice(0, 10)),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (request.method === "POST" && url.pathname === "/scores") {
      const { score, name } = await request.json();
      if (typeof score !== "number" || score < 0) {
        throw new Error("Invalid score");
      }
      if (!name || typeof name !== "string") {
        throw new Error("Invalid player name");
      }

      const username = name.split("#")[0];
      if (username.length > 12) {
        throw new Error("Username must be 12 characters or less");
      }

      const scores = (await env.SCORES.get("highscores", "json")) || [];
      const tripcode = generateHash(name.split("#")[1], username); // Generate unique 6-character hash using username and password
      scores.push({
        score,
        name: username,
        tripcode,
        timestamp: Date.now(),
      });

      await env.SCORES.put(
        "highscores",
        JSON.stringify(scores.sort((a, b) => b.score - a.score).slice(0, 100))
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
