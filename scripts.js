//=============================================================================
// GAME STATE AND GLOBAL VARIABLES
//=============================================================================

// Core game state
let gameState = "start";
let gameLoop;
let score = 0;
let wave = 0;

// Stalker mechanics
let stalkers = [];         // Active stalkers
let stalkerSpawnTime = 30000;  // Time before first stalker (30 seconds)
let stalkerSpawnInterval = 15000;  // Time between additional stalkers (15 seconds)
let lastStalkerSpawn = 0;    // Track last stalker spawn time
let waveStartTime = 0;       // Track when the current wave started

// Player configuration
let player = {
  x: 40,
  y: 12,
  char: "@",
  dx: 0,
  dy: 0,
  shootDx: 0,
  shootDy: -1,
};

// Game entities
let bullets = [];        // Player projectiles
let enemies = [];        // Active enemies
let enemyBullets = [];   // Enemy projectiles
// Game dimensions and mechanics
let gameWidth = 80;      // Game area width
let gameHeight = 35;     // Game area height
let bulletSpeed = 0.8;   // Projectile velocity
let enemySpeed = 0.1;    // Base enemy movement speed
let spawnRate = 0.01;    // Initial enemy spawn probability
let stalkerSpeed = 0.05; // Stalker movement speed

//=============================================================================
// BOSS CONFIGURATIONS
//=============================================================================

// Define different boss types with unique behaviors and attributes
const BOSS_TYPES = {
  TANK: {
    char: "$$",
    health: 25,
    speed: 0.05,
    points: 20,
    shootInterval: 3000,
    ability: "mine"
  },
  SHOOTER: {
    char: "@@",
    health: 15,
    speed: 0.1,
    points: 20,
    shootInterval: 2000,
    ability: "shoot"
  },
  SPAWNER: {
    char: "%%",
    health: 20,
    speed: 0.15,
    points: 20,
    spawnInterval: 2000,
    ability: "spawn"
  }
};


//=============================================================================
// GAME LIFECYCLE MANAGEMENT
//=============================================================================

/**
 * Initializes and starts a new game session
 * - Sets game state to playing
 * - Hides UI modals
 * - Shows game screen
 * - Initializes game state
 * - Starts game loop
 */
// Analytics tracking variables
let gameStartTime = 0;
let shotsFired = 0;
let enemiesKilled = 0;
let wavesCompleted = 0;

function startGame() {
  gameState = "playing";
  // Close all modal windows
  document.getElementById("modal-scores").style.display = "none";
  document.getElementById("modal-instructions").style.display = "none";
  document.getElementById("modal-stats").style.display = "none";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  document.getElementById("leaderboard").style.display = "block";
  document.getElementById("high-score-display").style.display = "block";
  initGame();
  gameLoop = setInterval(updateGame, 1000 / 30);
  
  // Reset analytics tracking
  gameStartTime = Date.now();
  shotsFired = 0;
  enemiesKilled = 0;
  wavesCompleted = 0;
  
  // Track game start
  trackGameEvent('gameStart', {
    timestamp: gameStartTime
  });
}

// Analytics tracking function
function trackGameEvent(eventName, data = {}) {
  // Track events using Plausible Analytics
  const eventProps = {
    props: {
      ...data,
      gameId: gameStartTime
    }
  };

  // Map game events to Plausible goals
  switch(eventName) {
    case 'gameStart':
      plausible('Game Started', eventProps);
      break;
    case 'gameEnd':
      plausible('Game Ended', {
        props: {
          ...data,
          finalScore: score,
          wavesCompleted: wave,
          timePlayedSeconds: Math.floor((Date.now() - gameStartTime) / 1000)
        }
      });
      break;
    case 'shotFired':
      plausible('Shot Fired', {
        props: {
          ...data,
          totalShots: shotsFired,
          playerPosition: { x: player.x, y: player.y }
        }
      });
      break;
    case 'waveCompleted':
      plausible('Wave Completed', {
        props: {
          ...data,
          waveNumber: wave,
          totalWaves: wavesCompleted,
          score: score
        }
      });
      break;
    case 'enemyKilled':
      plausible('Enemy Killed', {
        props: {
          ...data,
          totalKills: enemiesKilled,
          isBoss: data.isBoss || false,
          scoreIncrease: data.isBoss ? 20 : 10,
          score: score
        }
      });
      break;
  }
}

/**
 * Resets all game variables to their initial states
 * - Resets score and wave
 * - Resets player position and movement
 * - Clears all game entities
 * - Resets game difficulty parameters
 */
function initGame() {
  score = 0;
  wave = 0;
  player.x = 40;
  player.y = 12;
  player.dx = 0;
  player.dy = 0;
  player.shootDx = 0;
  player.shootDy = -1;
  bullets = [];
  enemies = [];
  enemyBullets = [];
  spawnRate = 0.02;
  enemySpeed = 0.2;
}

//=============================================================================
// ENEMY SPAWNING AND MANAGEMENT
//=============================================================================

/**
 * Creates and spawns a new enemy or boss at a random edge location
 * @param {boolean} isBoss - Whether to spawn a boss enemy
 */
function spawnEnemy(isBoss = false) {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0: // top
      x = Math.random() * gameWidth;
      y = 0;
      break;
    case 1: // right
      x = gameWidth - 1;
      y = Math.random() * gameHeight;
      break;
    case 2: // bottom
      x = Math.random() * gameWidth;
      y = gameHeight - 1;
      break;
    case 3: // left
      x = 0;
      y = Math.random() * gameHeight;
      break;
  }

  if (isBoss) {
    const bossTypes = Object.keys(BOSS_TYPES);
    const selectedBoss = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    const bossConfig = BOSS_TYPES[selectedBoss];

    const boss = {
      x: x,
      y: y,
      char: bossConfig.char,
      health: bossConfig.health,
      speed: bossConfig.speed,
      points: bossConfig.points,
      ability: bossConfig.ability,
      isBoss: true,
      lastAbilityUse: Date.now(),
      abilityInterval: bossConfig.shootInterval || bossConfig.spawnInterval
    };

    enemies.push(boss);
  } else {
    const enemyType = Math.random() < 0.33 ? "&" : Math.random() < 0.5 ? "%" : "#";
    const baseSpeed = enemyType === "&" ? 0.8 : enemyType === "%" ? 1.2 : 1.0;
    enemies.push({
      x: x,
      y: y,
      char: enemyType,
      type: Math.floor(Math.random() * 3),
      health: 1,
      isBoss: false,
      baseSpeed: baseSpeed
    });
  }
}

//=============================================================================
// GAME UPDATE LOOP
//=============================================================================

/**
 * Main game update function - called every frame
 * Handles:
 * - Player movement and boundaries
 * - Bullet updates and collisions
 * - Enemy updates and AI
 * - Wave progression
 * - Score tracking
 * - Game state changes
 */
function updateGame() {
  // Update player movement and shooting
  player.x = Math.max(0, Math.min(gameWidth - 1, player.x + player.dx));
  player.y = Math.max(1, Math.min(gameHeight - 1, player.y + player.dy));

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].dx * bulletSpeed;
    bullets[i].y += bullets[i].dy * bulletSpeed;

    if (
      bullets[i].x < 0 ||
      bullets[i].x >= gameWidth ||
      bullets[i].y < 0 ||
      bullets[i].y >= gameHeight
    ) {
      bullets.splice(i, 1);
    }
  }

  // Update enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].x += enemyBullets[i].dx * bulletSpeed;
    enemyBullets[i].y += enemyBullets[i].dy * bulletSpeed;

    if (
      enemyBullets[i].x < 0 ||
      enemyBullets[i].x >= gameWidth ||
      enemyBullets[i].y < 0 ||
      enemyBullets[i].y >= gameHeight
    ) {
      enemyBullets.splice(i, 1);
      continue;
    }

    // Check player collision with enemy bullets
    if (
      Math.abs(player.x - enemyBullets[i].x) < 1 &&
      Math.abs(player.y - enemyBullets[i].y) < 1
    ) {
      endGame();
      return;
    }
  }

  // Update shoot function to track shots fired
  function shoot() {
    if (gameState !== "playing") return;
    
    bullets.push({
      x: player.x,
      y: player.y,
      dx: player.shootDx,
      dy: player.shootDy,
      char: "*"
    });
    
    shotsFired++;
    trackGameEvent('shotFired', {
      totalShots: shotsFired,
      playerPosition: { x: player.x, y: player.y }
    });
  }

  // Update enemies and check for wave completion
  if (enemies.length === 0) {
    wave++;
    wavesCompleted++;
    spawnRate = Math.min(0.08, spawnRate * 1.15);
    enemySpeed = Math.min(0.6, enemySpeed * 1.08);
    waveStartTime = Date.now();
    stalkers = []; // Reset stalkers for new wave
    
    // Track wave completion
    trackGameEvent('waveCompleted', {
      waveNumber: wave,
      totalWaves: wavesCompleted,
      score: score
    });
    
    // Check if it's a boss wave (every 5 waves)
    const isBossWave = wave % 5 === 0;
    
    // Spawn boss or regular enemies
    if (isBossWave) {
      spawnEnemy(true); // Spawn a boss
    } else {
      // Spawn regular enemies
      for (let i = 0; i < wave; i++) {
        spawnEnemy();
      }
    }
  }

  // Handle stalker spawning
  const currentTime = Date.now();
  if (currentTime - waveStartTime >= stalkerSpawnTime && 
      (stalkers.length === 0 || currentTime - lastStalkerSpawn >= stalkerSpawnInterval)) {
    // Spawn a new stalker
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = Math.random() * gameWidth; y = 0; break;
      case 1: x = gameWidth - 1; y = Math.random() * gameHeight; break;
      case 2: x = Math.random() * gameWidth; y = gameHeight - 1; break;
      case 3: x = 0; y = Math.random() * gameHeight; break;
    }
    stalkers.push({ x, y, char: "Ξ" });
    lastStalkerSpawn = currentTime;
  }

  // Update stalkers
  stalkers.forEach(stalker => {
    const dx = player.x - stalker.x;
    const dy = player.y - stalker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    stalker.x += (dx / dist) * stalkerSpeed;
    stalker.y += (dy / dist) * stalkerSpeed;

    // Check player collision with stalker
    if (Math.abs(player.x - stalker.x) < 1 && Math.abs(player.y - stalker.y) < 1) {
      endGame();
      return;
    }
  });

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    // Skip if enemy was already removed
    if (!enemies[i]) continue;
    
    const dx = player.x - enemies[i].x;
    const dy = player.y - enemies[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const currentSpeed = enemySpeed * (enemies[i].baseSpeed || 1.0);
    enemies[i].x += (dx / dist) * currentSpeed;
    enemies[i].y += (dy / dist) * currentSpeed;

    // Check bullet collisions
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (
        Math.abs(bullets[j].x - enemies[i].x) < 1 &&
        Math.abs(bullets[j].y - enemies[i].y) < 1
      ) {
        enemies[i].health--;
        bullets.splice(j, 1);
        
        if (enemies[i].health <= 0) {
          score += enemies[i].isBoss ? enemies[i].points : 10;
          enemies.splice(i, 1);
          enemiesKilled++;
          
          // Track enemy killed
          trackGameEvent('enemyKilled', {
            totalKills: enemiesKilled,
            isBoss: enemies[i]?.isBoss || false,
            score: score
          });
          break;
        }
      }
    }

    // Skip rest of loop if enemy was destroyed
    if (!enemies[i]) continue;

    // Boss abilities
    if (enemies[i].isBoss && Date.now() - enemies[i].lastAbilityUse >= enemies[i].abilityInterval) {
      const boss = enemies[i];
      boss.lastAbilityUse = Date.now();

      switch (boss.ability) {
        case "shoot":
          // Shoot in 8 directions
          const directions = [
            {dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1},
            {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: -1, dy: -1}
          ];
          directions.forEach(dir => {
            enemyBullets.push({
              x: boss.x,
              y: boss.y,
              dx: dir.dx,
              dy: dir.dy,
              char: "*"
            });
          });
          break;

        case "mine":
          // Drop a stationary bullet
          enemyBullets.push({
            x: boss.x,
            y: boss.y,
            dx: 0,
            dy: 0,
            char: "o"
          });
          break;

        case "spawn":
          // Spawn a regular enemy at boss position
          enemies.push({
            x: boss.x,
            y: boss.y,
            char: Math.random() < 0.33 ? "&" : Math.random() < 0.5 ? "%" : "#",
            type: Math.floor(Math.random() * 3),
            health: 1,
            isBoss: false
          });
          break;
      }
    }

    // Check player collision
    if (
      i >= 0 &&
      Math.abs(player.x - enemies[i].x) < 1 &&
      Math.abs(player.y - enemies[i].y) < 1
    ) {
      endGame();
      return;
    }
  }

  // Spawn enemies
  if (Math.random() < spawnRate) {
    spawnEnemy();
  }

  drawGame();
}


//=============================================================================
// RENDERING
//=============================================================================

/**
 * Renders the game state to the screen
 * - Creates the game grid
 * - Renders bullets, enemies, and player
 * - Applies colors and styling
 * - Updates the game UI
 */
function drawGame() {
  let screen = Array(gameHeight)
    .fill()
    .map(() => Array(gameWidth).fill(" "));

  // Draw bullets (both player and enemy)
  bullets.forEach((bullet) => {
    const x = Math.floor(bullet.x);
    const y = Math.floor(bullet.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-bullet)">*</span>`;
    }
  });

  // Draw enemy bullets
  enemyBullets.forEach((bullet) => {
    const x = Math.floor(bullet.x);
    const y = Math.floor(bullet.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-enemy-bullet)">${bullet.char}</span>`;
    }
  });

  // Draw stalkers
  stalkers.forEach((stalker) => {
    const x = Math.floor(stalker.x);
    const y = Math.floor(stalker.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-stalker); animation: pulse 2s infinite;">${stalker.char}</span>`;
    }
  });

  // Draw enemies
  enemies.forEach((enemy) => {
    const x = Math.floor(enemy.x);
    const y = Math.floor(enemy.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      const enemyColors = ["--ctp-enemy1", "--ctp-enemy2", "--ctp-enemy3"];
      screen[y][x] = `<span style="color: var(${enemyColors[enemy.type]})">${
        enemy.char
      }</span>`;
    }
  });

  // Draw player
  const playerX = Math.floor(player.x);
  const playerY = Math.floor(player.y);
  if (
    playerX >= 0 &&
    playerX < gameWidth &&
    playerY >= 0 &&
    playerY < gameHeight
  ) {
    screen[playerY][
      playerX
    ] = `<span style="color: var(--ctp-player)">${player.char}</span>`;
  }

  // Draw score and wave
  let statusText = `<span class="status-text">Score: ${score} | Wave: ${wave}</span>`;
  statusText.split("").forEach((char, i) => {
    if (i < gameWidth) screen[0][i] = char;
  });

  // Render screen
  document.getElementById("game-screen").innerHTML = screen
    .map((row) => row.join(""))
    .join("<br>");
}
  player.y = Math.max(1, Math.min(gameHeight - 1, player.y + player.dy));
/**
 * Handles game over state
 * - Stops game loop
 * - Updates high scores
 * - Shows end screen
 * - Updates statistics
 * - Displays leaderboard
 */
function endGame() {
  gameState = "end";
  clearInterval(gameLoop);
  // Dispatch game end event for analytics
  document.dispatchEvent(new Event('gameEnd'));
  // Update high scores in localStorage
  const highScore = parseInt(localStorage.getItem("asciitron-highscore")) || 0;
  const highWave = parseInt(localStorage.getItem("asciitron-highwave")) || 0;
  const gamesPlayed =
    parseInt(localStorage.getItem("asciitron-games-played")) || 0;
  const totalScore =
    parseInt(localStorage.getItem("asciitron-total-score")) || 0;

  if (score > highScore) {
    localStorage.setItem("asciitron-highscore", score);
  }
  if (wave > highWave) {
    localStorage.setItem("asciitron-highwave", wave);
  }
  // Update games played and total score
  localStorage.setItem("asciitron-games-played", gamesPlayed + 1);
  localStorage.setItem("asciitron-total-score", totalScore + score);
  // Hide game screen and display the end screen with final score
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("final-score").textContent = score;
  document.getElementById("end-screen").style.display = "block";
  document.getElementById("high-score-display").style.display = "none";
  // Prefill credentials if stored in localStorage for easier submission
  const savedCredentials = localStorage.getItem("asciitron-credentials");
  if (savedCredentials) {
    document.getElementById("player-credentials").value = savedCredentials;
  }
  // Also, update and display the bottom scores popup
  getLeaderboard().then(() => {
    document.getElementById("scores-popup").style.display = "block";
  });
}

//=============================================================================
// EVENT HANDLERS
//=============================================================================

/**
 * Global keyboard event handler
 * - Manages game state transitions
 * - Controls player movement
 * - Handles UI interactions
 */
document.addEventListener("keydown", (e) => {
  if (gameState === "start") {
    if (e.code === "Space") {
      startGame();
      return;
    } else if (e.code === "KeyT") {
      const modalScores = document.getElementById("modal-scores");
      const modalInstructions = document.getElementById("modal-instructions");
      const modalStats = document.getElementById("modal-stats");

      // Close other modals first
      modalInstructions.style.display = "none";
      modalStats.style.display = "none";

      if (modalScores.style.display === "block") {
        modalScores.style.display = "none";
      } else {
        updateModalScores();
        modalScores.style.display = "block";
      }
      return;
    } else if (e.code === "KeyY") {
      const modalInstructions = document.getElementById("modal-instructions");
      const modalScores = document.getElementById("modal-scores");
      const modalStats = document.getElementById("modal-stats");

      // Close other modals first
      modalScores.style.display = "none";
      modalStats.style.display = "none";

      modalInstructions.style.display =
        modalInstructions.style.display === "block" ? "none" : "block";
      return;
    } else if (e.code === "KeyU") {
      const modalStats = document.getElementById("modal-stats");
      const modalScores = document.getElementById("modal-scores");
      const modalInstructions = document.getElementById("modal-instructions");

      // Close other modals first
      modalScores.style.display = "none";
      modalInstructions.style.display = "none";

      if (modalStats.style.display === "block") {
        modalStats.style.display = "none";
      } else {
        document.getElementById("stat-highscore").textContent =
          localStorage.getItem("asciitron-highscore") || "0";
        document.getElementById("stat-highwave").textContent =
          localStorage.getItem("asciitron-highwave") || "0";
        document.getElementById("stat-games-played").textContent =
          localStorage.getItem("asciitron-games-played") || "0";
        document.getElementById("stat-total-score").textContent =
          localStorage.getItem("asciitron-total-score") || "0";
        modalStats.style.display = "block";
      }
      return;
    }
  } else if (gameState === "end") {
    // Don't trigger hotkeys if user is typing in the input field
    if (
      document.activeElement === document.getElementById("player-credentials")
    ) {
      return;
    }

    if (e.code === "KeyV") {
      saveScore();
      return;
    } else if (e.code === "KeyR") {
      restartGame();
      return;
    }
  }

  if (gameState === "playing") {
    switch (e.code) {
      // Movement controls (WASD)
      case "KeyW":
        player.dy = -1;
        break;
      case "KeyS":
        player.dy = 1;
        break;
      case "KeyA":
        player.dx = -1;
        break;
      case "KeyD":
        player.dx = 1;
        break;

      // Shooting controls (Arrow keys)
      case "ArrowUp":
        bullets.push({ x: player.x, y: player.y, dx: 0, dy: -1 });
        document.dispatchEvent(new Event('shotFired'));
        break;
      case "ArrowDown":
        bullets.push({ x: player.x, y: player.y, dx: 0, dy: 1 });
        document.dispatchEvent(new Event('shotFired'));
        break;
      case "ArrowLeft":
        bullets.push({ x: player.x, y: player.y, dx: -1, dy: 0 });
        document.dispatchEvent(new Event('shotFired'));
        break;
      case "ArrowRight":
        bullets.push({ x: player.x, y: player.y, dx: 1, dy: 0 });
        document.dispatchEvent(new Event('shotFired'));
        break;
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (gameState === "playing") {
    switch (e.code) {
      // Stop movement when keys are released
      case "KeyW":
      case "KeyS":
        player.dy = 0;
        break;
      case "KeyA":
      case "KeyD":
        player.dx = 0;
        break;
    }
  }
});

// Placeholder for the leaderboard API
async function submitScore(score) {
  try {
    const input = prompt(
      "Enter your name and password (format: name#password):",
      "Player#pass"
    );
    if (!input) return;

    const [displayName, password] = input.split("#");
    if (!displayName || !password) {
      alert("Invalid format. Please use: name#password");
      return;
    }

    // Create a hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const response = await fetch(
      "https://asciitron-api.leefamous.workers.dev/scores",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          name: `${displayName}#${hashHex}`,
        }),
      }
    );
    const result = await response.json();
    if (!result.success) {
      throw new Error("Failed to submit score");
    }
    await getLeaderboard(); // Refresh leaderboard after submission
  } catch (error) {
    console.error("Error submitting score:", error);
    alert("Failed to submit score. Please try again.");
  }
}

function updateModalScores() {
  const modalContent = document.getElementById("modal-scores-content");
  // Reuse the current leaderboard content if available
  modalContent.innerHTML = document.getElementById("scores").innerHTML;
}

// NEW: Fetch the leaderboard from the server and update the leaderboard display.
async function getLeaderboard() {
  try {
    const response = await fetch(
      "https://asciitron-api.leefamous.workers.dev/scores",
      { headers: { "Content-Type": "application/json" } }
    );
    const scores = await response.json();
    console.log("Leaderboard response:", scores);
    updateLeaderboardDisplay(scores); // for any existing leaderboard UI
    updateScoresPopup(scores); // update the new bottom popup
    return scores;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
}

// NEW: Update the on-screen leaderboard (inside #scores) with the top 100 scores
function updateLeaderboardDisplay(scores) {
  console.log("Updating leaderboard with", scores.length, "scores.");
  const catppuccinColors = [
    "#f5c2e7", // pink
    "#cba6f7", // mauve
    "#89b4fa", // blue
    "#94e2d5", // teal
    "#a6e3a1", // green
    "#fab387", // peach
    "#f38ba8", // red
    "#eba0ac", // maroon
  ];
  const scoresDiv = document.getElementById("scores");
  if (scores && scores.length > 0) {
    // Update the high score display
    const highestScoreEntry = scores.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );
    const color = getColorFromTripcode(highestScoreEntry.tripcode);
    document.getElementById("display-high-score").innerHTML = 
      `<div style="font-family: 'Courier New', monospace; white-space: pre;">1. <span style="color: ${color}; display: inline-block; width: 165px">${highestScoreEntry.name}<span style="font-family: monospace; font-size: 0.7em; opacity: 0.3; display: inline-block; width: 60px"> !${highestScoreEntry.tripcode}</span></span><span style="color: ${color}; opacity: 0.8; display: inline-block; width: 40px; text-align: right">${highestScoreEntry.score}</span></div>`;

    const topScores = scores.slice(0, 100);
    scoresDiv.innerHTML = topScores
      .map((score, index) => {
        const color = getColorFromTripcode(score.tripcode);
        const rowStyle = index % 2 === 0 ? "" : " background-color: rgba(49, 50, 68, 0.3);";
        return `<div style="font-family: 'Courier New', monospace; white-space: pre;${rowStyle}">${(index + 1).toString().padStart(3, ' ')}. <span style="color: ${color}; display: inline-block; width: 165px">${score.name}<span style="font-family: monospace; font-size: 0.7em; opacity: 0.3; display: inline-block; width: 60px"> !${score.tripcode}</span></span><span style="color: ${color}; opacity: 0.8; display: inline-block; width: 40px; text-align: right">${score.score}</span></div>`;
      })
      .join("");
  } else {
    scoresDiv.innerHTML = "No scores yet";
  }
}

// NEW: Add getColorFromTripcode() to determine the display color for a given tripcode.
function getColorFromTripcode(tripcode) {
  const catppuccinColors = [
    "#f5c2e7", // pink
    "#cba6f7", // mauve
    "#89b4fa", // blue
    "#94e2d5", // teal
    "#a6e3a1", // green
    "#fab387", // peach
    "#f38ba8", // red
    "#eba0ac", // maroon
  ];
  const colorIndex = tripcode.charCodeAt(0) % catppuccinColors.length;
  return catppuccinColors[colorIndex];
}

// NEW: Load leaderboard when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  getLeaderboard();
});

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.opacity = 1;
  setTimeout(() => {
    notification.style.opacity = 0;
  }, 2000);
}

// New function to save the score using credentials entered in the end-screen
function saveScore() {
  // Check if score was already saved
  if (document.getElementById("save-score-text").textContent === "[V] Score Saved!") {
    return;
  }

  const input = document.getElementById("player-credentials").value;
  if (!input) {
    showNotification("Please enter credentials in the format: Name#Password");
    return;
  }
  const [displayName, password] = input.split("#");
  // Check username length
  if (!displayName || displayName.length > 12) {
    showNotification("Username must be between 1-12 characters");
    return;
  }
  if (!displayName || !password) {
    showNotification("Invalid format. Please use: Name#Password");
    return;
  }

  showNotification("Saving score...");

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  crypto.subtle
    .digest("SHA-256", data)
    .then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return fetch("https://asciitron-api.leefamous.workers.dev/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          name: `${displayName}#${hashHex}`,
        }),
      });
    })
    .then((response) => response.json())
    .then((result) => {
      if (!result.success) {
        throw new Error("Failed to submit score");
      }
      localStorage.setItem(
        "asciitron-credentials",
        document.getElementById("player-credentials").value
      );
      getLeaderboard();
      showNotification("Score saved!");
      // Update the save text and disable the save functionality
      const saveText = document.getElementById("save-score-text");
      saveText.textContent = "[V] Score Saved!";
      saveText.style.opacity = "0.3";
      saveText.style.cursor = "default";
      saveText.style.pointerEvents = "none";
    })
    .catch((error) => {
      console.error("Error saving score:", error);
      showNotification("Failed to save score. Please try again.");
    });
}

function restartGame() {
  document.getElementById("end-screen").style.display = "none";
  document.getElementById("player-credentials").value = "";
  // Reset the save score text for the next game
  const saveText = document.getElementById("save-score-text");
  saveText.textContent = "[V] Save Score";
  saveText.style.opacity = "1";
  document.getElementById("scores-popup").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
  gameState = "start";
}

// NEW: Update the bottom scores popup with the top 10 scores.
function updateScoresPopup(scores) {
  const popup = document.getElementById("scores-popup");
  if (scores && scores.length > 0) {
    const topScores = scores.slice(0, 10);
    popup.innerHTML = topScores
      .map((score, index) => {
        const color = getColorFromTripcode(score.tripcode);
        const rowStyle = index % 2 === 0 ? "" : " background-color: rgba(49, 50, 68, 0.3);";
        return `<div style="font-family: 'Courier New', monospace; white-space: pre;${rowStyle}">${(index + 1).toString().padStart(3, ' ')}. <span style="color: ${color}; display: inline-block; width: 165px">${score.name}<span style="font-family: monospace; font-size: 0.7em; opacity: 0.3; display: inline-block; width: 60px"> !${score.tripcode}</span></span><span style="color: ${color}; opacity: 0.8; display: inline-block; width: 40px; text-align: right">${score.score}</span></div>`;
      })
      .join("");
  } else {
    popup.innerHTML = "No scores yet.";
  }
}

function createBullet() {
  const bullet = document.createElement('div');
  bullet.className = 'bullet';
  bullet.textContent = '•';
  document.querySelector('.graphics-animation').appendChild(bullet);
  
  bullet.addEventListener('animationend', () => {
    bullet.remove();
  });
}

setInterval(createBullet, 2000);
