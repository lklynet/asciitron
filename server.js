const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Data storage path
const DATA_DIR = path.join(__dirname, "data");
const SCORES_FILE = path.join(DATA_DIR, "scores.json");
const SUSPICIOUS_IPS_FILE = path.join(DATA_DIR, "suspicious_ips.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}
ensureDataDir();

// Helper functions from worker.js
const hashChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

function generateHash(input, username) {
  const combinedInput = username + "#" + input;
  let result = "";
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
    if (lastSubmission && now - lastSubmission < 1000) {
      // Minimum 1s between games (worker code said 1000ms but comment said 60s? checking worker code again: 1000ms is 1s. comment said 60s. code wins.)
      return false;
    }
    this.scoreSubmissions.set(ip, now);
    return true;
  }
}

const rateLimiter = new RateLimiter();
const suspiciousIPs = new Set();
let profanityList = null;

async function fetchProfanityList() {
  if (profanityList) return profanityList;
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/refs/heads/main/data/en.txt"
    );
    const text = await response.text();
    profanityList = new Set(text.split("\n").filter((word) => word.trim()));
    return profanityList;
  } catch (error) {
    console.error("Error fetching profanity list:", error);
    return new Set();
  }
}

// Persistence helpers
async function getScores() {
  try {
    const data = await fs.readFile(SCORES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function saveScores(scores) {
  await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
}

async function saveSuspiciousIp(ip) {
  suspiciousIPs.add(ip);
  try {
    await fs.writeFile(
      SUSPICIOUS_IPS_FILE,
      JSON.stringify(Array.from(suspiciousIPs), null, 2)
    );
  } catch (error) {
    console.error("Error saving suspicious IPs:", error);
  }
}

// Routes
app.get("/scores", async (req, res) => {
  const clientIp = req.ip;
  if (rateLimiter.isRateLimited(clientIp)) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  try {
    const scores = await getScores();
    res.json(scores.sort((a, b) => b.score - a.score).slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/scores", async (req, res) => {
  const clientIp = req.ip;
  if (rateLimiter.isRateLimited(clientIp)) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  try {
    const { score, name, waveCount } = req.body;

    if (typeof score !== "number" || score < 0) {
      throw new Error("Invalid score");
    }

    if (!rateLimiter.checkScoreSubmission(clientIp)) {
      throw new Error("Please wait before submitting another score");
    }

    // Validation logic from worker
    const expectedMaxScore = waveCount * 100 + Math.floor(waveCount / 5) * 20;
    // Note: The worker code had a logic gap where it checked expectedMaxScore but didn't throw?
    // Wait, let me check the worker code again.
    // Line 122: if (score > expectedMaxScore) { throw new Error(...) }
    // Yes, it throws.

    if (score > expectedMaxScore) {
      // The original worker code had this check but maybe I missed if it was commented out or strictly enforced.
      // Re-reading worker code:
      // 122: if (score > expectedMaxScore) { throw new Error("Score exceeds possible amount for waves completed"); }
      // It IS enforced.
      throw new Error("Score exceeds possible amount for waves completed");
    }

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

    const profanityWords = await fetchProfanityList();
    const lowercaseUsername = username.toLowerCase();
    if (
      Array.from(profanityWords).some((word) =>
        lowercaseUsername.includes(word.toLowerCase())
      )
    ) {
      throw new Error("Username rejected: Contains inappropriate language");
    }

    const scores = await getScores();
    const tripcode = generateHash(name.split("#")[1] || "", username);
    // Note: name.split("#")[1] might be undefined if no password provided, but client enforces it.

    scores.push({
      score,
      name: username,
      tripcode,
      timestamp: Date.now(),
    });

    // Suspicious activity check
    const userScores = scores.filter((s) => s.name === username);
    if (userScores.length > 0) {
      const averageScore =
        userScores.reduce((acc, curr) => acc + curr.score, 0) /
        userScores.length;
      if (score > averageScore * 3) {
        saveSuspiciousIp(clientIp);
      }
    }

    // Sort and keep top 100
    const sortedScores = scores.sort((a, b) => b.score - a.score);
    const topScores = sortedScores.slice(0, 100);

    await saveScores(topScores);

    const playerPosition =
      topScores.findIndex(
        (s) =>
          s.name === username && s.score === score && s.tripcode === tripcode
      ) + 1;

    res.json({
      success: true,
      position: playerPosition,
      totalPlayers: sortedScores.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
