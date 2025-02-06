const corsHeaders = {
  "Access-Control-Allow-Origin": "https://asciitron.lkly.net",
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
    this.scoreSubmissions = new Map();
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

  checkScoreSubmission(ip) {
    const now = Date.now();
    const lastSubmission = this.scoreSubmissions.get(ip);
    if (lastSubmission && now - lastSubmission < 60000) { // Minimum 60s between games
      return false;
    }
    this.scoreSubmissions.set(ip, now);
    return true;
  }
}

const rateLimiter = new RateLimiter();
const suspiciousIPs = new Set();

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
      const { score, name, waveCount } = await request.json();
      if (typeof score !== "number" || score < 0) {
        throw new Error("Invalid score");
      }

      // Validate time between score submissions
      if (!rateLimiter.checkScoreSubmission(clientIp)) {
        throw new Error("Please wait before submitting another score");
      }

      // Validate wave count and score correlation
      // Regular waves: 10 enemies * 10 points = 100 points per wave
      // Boss waves (every 5th wave): 20 additional points
      const expectedMaxScore = (waveCount * 100) + (Math.floor(waveCount / 5) * 20);
      if (score > expectedMaxScore) {
        throw new Error("Score exceeds possible amount for waves completed");
      }
      
      // Validate score based on game mechanics
      // Maximum possible score calculation:
      // Assuming maximum 100 waves (very generous)
      // Regular waves (95): 95 waves * 10 enemies * 10 points = 9,500
      // Boss waves (5): 5 bosses * 20 points = 100
      // Total maximum possible: 9,600
      const MAX_POSSIBLE_SCORE = 9600;
      if (score > MAX_POSSIBLE_SCORE) {
        throw new Error("Invalid score: Exceeds maximum possible score");
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

      // Track suspicious activity
      const userScores = scores.filter(s => s.name === username);
      if (userScores.length > 0) {
        const averageScore = userScores.reduce((acc, curr) => acc + curr.score, 0) / userScores.length;
        if (score > averageScore * 3) {
          suspiciousIPs.add(clientIp);
        }
      }

      await env.SCORES.put(
        "highscores",
        JSON.stringify(scores.sort((a, b) => b.score - a.score).slice(0, 100))
      );

      // Store suspicious IPs for monitoring
      if (suspiciousIPs.size > 0) {
        await env.SCORES.put("suspicious_ips", JSON.stringify(Array.from(suspiciousIPs)));
      }

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
