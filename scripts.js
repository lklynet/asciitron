let gameState = "start";
let gameLoop;
let score = 0;
let wave = 0;
let player = {
  x: 40,
  y: 12,
  char: "@",
  dx: 0,
  dy: 0,
  shootDx: 0,
  shootDy: -1,
};
let bullets = [];
let enemies = [];
let gameWidth = 80;
let gameHeight = 24;
let bulletSpeed = 0.8;
let enemySpeed = 0.1;
let spawnRate = 0.01;

function startGame() {
  gameState = "playing";
  // Close all modal windows
  document.getElementById("modal-scores").style.display = "none";
  document.getElementById("modal-instructions").style.display = "none";
  document.getElementById("modal-stats").style.display = "none";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  document.getElementById("leaderboard").style.display = "block";
  initGame();
  gameLoop = setInterval(updateGame, 1000 / 30);
}

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
  spawnRate = 0.02;
  enemySpeed = 0.2;
}

function spawnEnemy() {
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

  enemies.push({
    x: x,
    y: y,
    char: Math.random() < 0.33 ? "&" : Math.random() < 0.5 ? "%" : "#",
    type: Math.floor(Math.random() * 3),
  });
}

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

  // Update enemies and check for wave completion
  if (enemies.length === 0) {
    wave++;
    spawnRate = Math.min(0.08, spawnRate * 1.15);
    enemySpeed = Math.min(0.6, enemySpeed * 1.08);
    // Spawn initial enemies for the new wave
    for (let i = 0; i < wave; i++) {
      spawnEnemy();
    }
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const dx = player.x - enemies[i].x;
    const dy = player.y - enemies[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    enemies[i].x += (dx / dist) * enemySpeed;
    enemies[i].y += (dy / dist) * enemySpeed;

    // Check bullet collisions
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (
        Math.abs(bullets[j].x - enemies[i].x) < 1 &&
        Math.abs(bullets[j].y - enemies[i].y) < 1
      ) {
        score += 10;
        enemies.splice(i, 1);
        bullets.splice(j, 1);
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

  // Increase difficulty
  if (enemies.length === 0) {
    wave++;
    spawnRate = Math.min(0.08, spawnRate * 1.15);
    enemySpeed = Math.min(0.6, enemySpeed * 1.08);
  }

  drawGame();
}

function updatePlayer() {
  if (!player.isJumping) {
    player.velocityY += gravity;
  }

  player.x += player.velocityX;
  player.y += player.velocityY;

  // Apply friction
  player.velocityX *= 0.9;

  // Screen boundaries
  if (player.x < 0) {
    player.x = 0;
    player.velocityX = 0;
  } else if (player.x >= gameWidth) {
    player.x = gameWidth - 1;
    player.velocityX = 0;
  }
}

function updateCamera() {
  // Adjust camera to follow player vertically
  const targetCameraY = player.y - gameHeight * 0.7;
  camera.y += (targetCameraY - camera.y) * 0.1;
}

function checkCollisions() {
  player.isJumping = true;

  platforms.forEach((platform) => {
    if (
      player.velocityY >= 0 && // Moving downward
      player.y >= platform.y &&
      player.y <= platform.y + 1 && // Within platform height
      player.x >= platform.x &&
      player.x < platform.x + platform.width
    ) {
      // Within platform width

      player.y = platform.y;
      player.velocityY = 0;
      player.isJumping = false;

      // Update score when reaching new heights
      const newLevel = Math.floor(Math.abs(platform.y) / 3);
      if (newLevel > currentLevel) {
        currentLevel = newLevel;
        score = currentLevel * 100;
      }
    }
  });

  // Check for floor collision
  if (player.y >= floorLevel) {
    player.y = floorLevel;
    player.velocityY = 0;
    player.isJumping = false;
  }
}

function cleanupPlatforms() {
  // Add new platforms as player moves up
  const highestPlatform = platforms[platforms.length - 1];
  if (player.y < highestPlatform.y + gameHeight) {
    addNewPlatform();
  }

  // Remove platforms that are too far below
  platforms = platforms.filter(
    (platform) => platform.y < camera.y + gameHeight * 2
  );
}

function drawGame() {
  let screen = Array(gameHeight)
    .fill()
    .map(() => Array(gameWidth).fill(" "));

  // Draw bullets
  bullets.forEach((bullet) => {
    const x = Math.floor(bullet.x);
    const y = Math.floor(bullet.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-bullet)">*</span>`;
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
  // Draw player with player color
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
    .join("\n");
}

function endGame() {
  gameState = "end";
  clearInterval(gameLoop);
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
        break;
      case "ArrowDown":
        bullets.push({ x: player.x, y: player.y, dx: 0, dy: 1 });
        break;
      case "ArrowLeft":
        bullets.push({ x: player.x, y: player.y, dx: -1, dy: 0 });
        break;
      case "ArrowRight":
        bullets.push({ x: player.x, y: player.y, dx: 1, dy: 0 });
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
    const topScores = scores.slice(0, 100);
    scoresDiv.innerHTML = topScores
      .map((score, index) => {
        const color = getColorFromTripcode(score.tripcode);
        const rowStyle = index % 2 === 0 ? "" : " background-color: rgba(49, 50, 68, 0.3);";
        return `<div style="font-family: 'Courier New', monospace; white-space: pre;${rowStyle}">${(index + 1).toString().padStart(3, ' ')}. <span style="color: ${color}; display: inline-block; width: 165px">${score.name}<span style="font-family: monospace; font-size: 0.7em; opacity: 0.3; display: inline-block; width: 60px"> !${score.tripcode}</span></span>-<span style="color: ${color}; opacity: 0.8; display: inline-block; width: 40px; text-align: right">${score.score}</span></div>`;
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
  if (
    document.getElementById("save-score-text").textContent === "[V] Score Saved!"
  ) {
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
      saveText.style.opacity = "0.5";
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
        return `<div style="font-family: 'Courier New', monospace; white-space: pre;${rowStyle}">${(index + 1).toString().padStart(3, ' ')}. <span style="color: ${color}; display: inline-block; width: 165px">${score.name}<span style="font-family: monospace; font-size: 0.7em; opacity: 0.3; display: inline-block; width: 60px"> !${score.tripcode}</span></span>-<span style="color: ${color}; opacity: 0.8; display: inline-block; width: 40px; text-align: right">${score.score}</span></div>`;
      })
      .join("");
  } else {
    popup.innerHTML = "No scores yet.";
  }
}
