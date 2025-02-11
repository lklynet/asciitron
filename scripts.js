let initialSpawnRate = 0.015;    
let spawnRateIncrease = 1.10;    
let maxSpawnRate = 0.08;         

let initialEnemySpeed = 0.18;     
let enemySpeedIncrease = 1.05;     
let maxEnemySpeed = 0.6;          

let baseBulletSpeed = 0.8;       
let baseStalkerSpeed = 0.05;      
let baseEnemySpeedFactor = 1.0;   
let eliteEnemySpeedFactorIncrease = 1.2; 

let initialStalkerSpawnTime = 45000;
let stalkerSpawnIntervalTime = 15000; 

let breatherWaveSpawnRateFactor = 0.5; 
let breatherWaveEnemySpeedFactor = 0.8; 
let breatherWaveDuration = 5000;      
let lastBossWave = 0;                
let breatherWaveActive = false;        
let breatherWaveEndTime = 0;          

const ENEMY_SPEED_FACTORS = {
    "&": 0.8,  
    "%": 1.2,  
    "#": 1.0   
};

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
    shootInterval: 3000,
    ability: "shoot",
    shieldBullets: [], 
    shieldRadius: 3, 
    shieldBulletCount: 8, 
    rotationSpeed: 0.1, 
    lastShieldExplosion: 0, 
    shieldExplosionInterval: 5000 
  },
  GHOST: {
    char: "%%",
    health: 20,
    speed: 0.15,
    points: 20,
    spawnInterval: 2000,
    vanishInterval: 3000,
    vanishDuration: 2000,
    ability: "spawn",
    lastVanishTime: 0
  },
  CHARGE: { 
    char: "><",
    health: 20,
    speed: 0.2, 
    points: 25,
    chargeInterval: 3000,
    chargeSpeedFactor: 8, 
    chargeDistance: 15, 
    ability: "charge",
    lastChargeUse: 0
  },
  SHIELD: { 
    char: "[]",
    health: 30,
    speed: 0.08,
    points: 20,
    shieldInterval: 5000,
    shieldDuration: 2000,
    ability: "shield",
    isShielded: false,
    shieldEndTime: 0,
    mineInterval: 2000, 
    lastMineShot: 0
  },
  RAPID_FIRE: { 
    char: "==",
    health: 12,
    speed: 0.12,
    points: 20,
    rapidFireInterval: 2000,
    rapidFireDuration: 1500,
    ability: "rapidFire",
    isRapidFiring: false,
    rapidFireEndTime: 0,
    lastRapidFireUse: 0
  },
  AOE: { 
    char: "OO",
    health: 28,
    speed: 0.06,
    points: 20,
    aoeInterval: 7000,
    aoeBulletSpeed: 0.5,
    aoeBulletCount: 12,
    ability: "aoe",
    lastAoeUse: 0
  }
};

let gameState = "start";
let gameLoop;
let score = 0;
let wave = 0;
let eliteWaveActive = false; 

let stalkers = [];         
let stalkerSpawnTime = initialStalkerSpawnTime;
let stalkerSpawnInterval = stalkerSpawnIntervalTime;
let lastStalkerSpawn = 0;    
let waveStartTime = 0;       

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
let enemyBullets = [];   

let gameWidth = 80;      
let gameHeight = 35;     
let bulletSpeed = baseBulletSpeed;   
let enemySpeed = initialEnemySpeed;    
let spawnRate = initialSpawnRate;    
let stalkerSpeed = baseStalkerSpeed; 


let audioContext;
let backgroundMusicBuffer = null; // Store the decoded audio data
let backgroundMusicSource = null;  // Keep track of the currently playing source

try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    loadBackgroundMusic(); // Load music on startup
} catch (error) {
    console.error("Web Audio API is not supported in this browser:", error);
}

async function loadBackgroundMusic() {
    if (!audioContext) return;

    try {
        // You can replace this with any URL that points to an MP3, OGG, or WAV file
        const response = await fetch("https://www.chiptape.com/chiptape/BDC86.ogg"); // Example from chiptape.com
        const arrayBuffer = await response.arrayBuffer();
        backgroundMusicBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error("Error loading or decoding background music:", error);
        //  Consider a fallback: no music, but the game still works.
    }
}

function playBackgroundMusic() {
  if (!audioContext || !backgroundMusicBuffer) return;
    if (backgroundMusicSource) {
        backgroundMusicSource.stop(); // Stop any existing music
    }


  backgroundMusicSource = audioContext.createBufferSource();
  backgroundMusicSource.buffer = backgroundMusicBuffer;
  backgroundMusicSource.loop = true; // Loop the music
    const gainNode = audioContext.createGain(); //for volume
    gainNode.gain.value = 0.2; // Adjust volume (0.0 to 1.0)
    backgroundMusicSource.connect(gainNode);
  gainNode.connect(audioContext.destination);
  backgroundMusicSource.start();
}

function stopBackgroundMusic() {
    if (backgroundMusicSource) {
        backgroundMusicSource.stop();
        backgroundMusicSource = null; // Reset the source
    }
}


function playSound(frequency, duration, volume = 0.5, type = 'sine', detune = 0, callback) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.detune.setValueAtTime(detune, audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);

    if (callback) {
        oscillator.onended = callback;
    }
}


// More refined sound functions
function playPlayerShootSound() {
  playSound(240, 0.03, 0.3, 'sawtooth');     // Main impact
  playSound(120, 0.1, 0.1, 'square', -50); // Add some "crunch"
}

function playEnemyHitSound() {
    //  Short, percussive sound with a bit of noise.
    playSound(440, 0.03, 0.3, 'triangle');     // Main impact
    playSound(220, 0.1, 0.1, 'square', -50);  // Add some "crunch"
}
function playEnemyExplosionSound() {
    playSound(110, 0.3, 0.8, 'sawtooth', -100);
}

function playPlayerDeathSound() {
    playSound(55, 0.6, 1.0, 'sawtooth', -500);
}

function playStalkerSpawnSound() {
    playSound(60, 2, 0.7, 'sawtooth', 50);
}

function playBossSpawnSound() {
    playSound(40, 1.5, 1.0, 'sawtooth', 100, () => {
        playSound(60, 1, 0.7, 'sine', -500);
    });
}
function playBossDeathSound() { // ADD THIS FUNCTION
	playSound(75, 0.8, 1.0, 'sawtooth', -300);
}

function playMineExplosionSound() {
  playSound(220, 0.2, 0.8, 'square');
}

function startGame() {
  gameState = "playing";

  document.getElementById("modal-scores").style.display = "none";
  document.getElementById("modal-instructions").style.display = "none";
  document.getElementById("modal-stats").style.display = "none";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  document.getElementById("game-screen").classList.add("playing");
  document.getElementById("leaderboard").style.display = "block";
  document.getElementById("high-score-display").style.display = "block";
  initGame();
  gameLoop = setInterval(updateGame, 1000 / 30);
}

let mines = [];
let mineStartWave = 6;
let initialMineCount = 3;

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
  stalkers = [];
  mines = [];
  eliteWaveActive = false; 
  lastBossWave = 0;      
  breatherWaveActive = false; 

  spawnRate = initialSpawnRate;
  enemySpeed = initialEnemySpeed;
  stalkerSpawnTime = initialStalkerSpawnTime;
  stalkerSpawnInterval = stalkerSpawnIntervalTime;
}

function spawnMines() {
  if (wave >= mineStartWave) {
    const mineCount = initialMineCount + (wave - mineStartWave);
    for (let i = 0; i < mineCount; i++) {
      mines.push({
        x: Math.random() * (gameWidth - 2) + 1,
        y: Math.random() * (gameHeight - 2) + 1,
        char: 'o',
        health: 3
      });
    }
  }
}

function spawnEnemy(isBoss = false) {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0: 
      x = Math.random() * gameWidth;
      y = 0;
      break;
    case 1: 
      x = gameWidth - 1;
      y = Math.random() * gameHeight;
      break;
    case 2: 
      x = Math.random() * gameWidth;
      y = gameHeight - 1;
      break;
    case 3: 
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
      abilityInterval: bossConfig.shootInterval || bossConfig.spawnInterval || bossConfig.chargeInterval || bossConfig.shieldInterval || bossConfig.rapidFireInterval || bossConfig.aoeInterval,

      isInvisible: bossConfig.ability === "spawn" ? false : undefined,
      vanishEndTime: bossConfig.ability === "spawn" ? 0 : undefined,
      lastVanishTime: bossConfig.ability === "spawn" ? Date.now() : undefined,
      isCharging: bossConfig.ability === "charge" ? false : undefined,
      chargeTargetX: undefined,
      chargeTargetY: undefined,
      lastChargeUse: bossConfig.ability === "charge" ? Date.now() : undefined,
      isShielded: bossConfig.ability === "shield" ? false : undefined,
      shieldEndTime: bossConfig.ability === "shield" ? 0 : undefined,
      lastShieldUse: bossConfig.ability === "shield" ? Date.now() : undefined,
      lastMineShot: bossConfig.ability === "shield" ? Date.now() : undefined,
      isRapidFiring: bossConfig.ability === "rapidFire" ? false : undefined,
      rapidFireEndTime: bossConfig.ability === "rapidFire" ? 0 : undefined,
      lastRapidFireUse: bossConfig.ability === "rapidFire" ? Date.now() : undefined,
      aoeBulletSpeed: bossConfig.ability === "aoe" ? BOSS_TYPES.AOE.aoeBulletSpeed : undefined,
      aoeBulletCount: bossConfig.ability === "aoe" ? BOSS_TYPES.AOE.aoeBulletCount : undefined,
      lastAoeUse: bossConfig.ability === "aoe" ? Date.now() : undefined
    };

    enemies.push(boss);
    playBossSpawnSound();
  } else {
    const enemyType = Math.random() < 0.33 ? "&" : Math.random() < 0.5 ? "%" : "#";
    let speedFactor = ENEMY_SPEED_FACTORS[enemyType] || baseEnemySpeedFactor; 
    let eliteEnemyChar = enemyType; 
    let isElite = false;

    if (eliteWaveActive) {
        if (Math.random() < 0.4) { 
            isElite = true;
            speedFactor *= eliteEnemySpeedFactorIncrease; 
            eliteEnemyChar = enemyType.toUpperCase(); 
        }
    }

    enemies.push({
      x: x,
      y: y,
      char: isElite ? eliteEnemyChar : enemyType, 
      type: Math.floor(Math.random() * 3),
      health: 1,
      isBoss: false,
      speedFactor: speedFactor, 
      isElite: isElite 
    });
  }
}

function spawnMultipleBosses(waveNumber) {
    const numberOfBosses = Math.floor(waveNumber / 5); 
    for (let i = 0; i < numberOfBosses; i++) {
        spawnEnemy(true);
    }
}

function updateGame() {
  if (wave === 0) {
      spawnRate = initialSpawnRate * 0.7; 
      enemySpeed = initialEnemySpeed * 0.8; 
  }

  // Check player collision with mines
  for (let i = mines.length - 1; i >= 0; i--) {
    if (Math.abs(player.x - mines[i].x) < 0.8 && Math.abs(player.y - mines[i].y) < 0.8) {
      playPlayerDeathSound();
      endGame();
      return;
    }
  }

  if (breatherWaveActive && Date.now() > breatherWaveEndTime) {
      breatherWaveActive = false; 
      eliteWaveActive = true;      
      spawnRate = Math.min(maxSpawnRate, spawnRate * spawnRateIncrease); 
      enemySpeed = Math.min(maxEnemySpeed, enemySpeed * enemySpeedIncrease); 
  }

  let currentSpawnRate = breatherWaveActive ? spawnRate * breatherWaveSpawnRateFactor : spawnRate;
  let currentEnemySpeedBase = breatherWaveActive ? enemySpeed * breatherWaveEnemySpeedFactor : enemySpeed;

  player.x = Math.max(0, Math.min(gameWidth - 1, player.x + player.dx));
  player.y = Math.max(1, Math.min(gameHeight - 1, player.y + player.dy));

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
      continue;
    }

    // Check collision with mines and mine-type bullets
    for (let j = mines.length - 1; j >= 0; j--) {
      if (Math.abs(bullets[i].x - mines[j].x) < 1 && Math.abs(bullets[i].y - mines[j].y) < 1) {
        mines[j].health--;
        bullets.splice(i, 1);
        playMineExplosionSound();
        
        if (mines[j].health <= 0) {
          const mineX = mines[j].x;  // Store coordinates before splicing
          const mineY = mines[j].y;
          mines.splice(j, 1);
          
          // Check for nearby enemies using stored coordinates
          for (let k = enemies.length - 1; k >= 0; k--) {
            if (Math.abs(enemies[k].x - mineX) <= 3 && Math.abs(enemies[k].y - mineY) <= 3) {
              score += enemies[k].isBoss ? enemies[k].points : 10;
              enemies.splice(k, 1);
            }
          }
        }
        break;
      }
    }

    // Add collision check for mine-type enemy bullets
    if (bullets[i]) {
      for (let j = enemyBullets.length - 1; j >= 0; j--) {
        if (enemyBullets[j].char === "o" && 
            Math.abs(bullets[i].x - enemyBullets[j].x) < 1 && 
            Math.abs(bullets[i].y - enemyBullets[j].y) < 1) {
          const mineX = enemyBullets[j].x;  // Store coordinates before splicing
          const mineY = enemyBullets[j].y;
          bullets.splice(i, 1);
          enemyBullets.splice(j, 1);
          
          // Check for nearby enemies using stored coordinates
          for (let k = enemies.length - 1; k >= 0; k--) {
            if (Math.abs(enemies[k].x - mineX) <= 3 && Math.abs(enemies[k].y - mineY) <= 3) {
              score += enemies[k].isBoss ? enemies[k].points : 10;
              enemies.splice(k, 1);
            }
          }
          break;
        }
      }
    }
  }

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

    if (
      Math.abs(player.x - enemyBullets[i].x) < 0.8 &&
      Math.abs(player.y - enemyBullets[i].y) < 0.8
    ) {
      endGame();
      playPlayerDeathSound();
      return;
    }
  }

  if (enemies.length === 0) {
    wave++;
    eliteWaveActive = false; 
    mines = [];
    spawnMines();

    enemyBullets = enemyBullets.filter(bullet => bullet.char === "o");

    if (!breatherWaveActive) { 
        spawnRate = Math.min(maxSpawnRate, spawnRate * spawnRateIncrease); 
        enemySpeed = Math.min(maxEnemySpeed, enemySpeed * enemySpeedIncrease); 
    }

    waveStartTime = Date.now();
    stalkers = []; 

    stalkerSpawnTime = Math.max(10000, stalkerSpawnTime * 0.95); 
    stalkerSpawnInterval = Math.max(5000, stalkerSpawnInterval * 0.95); 

    const isBossWave = wave % 5 === 0;

    if (isBossWave) {
      spawnMultipleBosses(wave); 
      lastBossWave = wave; 
      breatherWaveActive = true; 
      breatherWaveEndTime = Date.now() + breatherWaveDuration; 

    } else if (wave === lastBossWave + 1) { 
        breatherWaveActive = true;
        breatherWaveEndTime = Date.now() + breatherWaveDuration;

        for (let i = 0; i < Math.max(1, Math.floor(wave * breatherWaveSpawnRateFactor)); i++) { 
            spawnEnemy();
        }

    }

    else {

      for (let i = 0; i < wave; i++) {
        spawnEnemy();
      }
    }
  }

  const currentTime = Date.now();
  if (currentTime - waveStartTime >= stalkerSpawnTime &&
      (stalkers.length === 0 || currentTime - lastStalkerSpawn >= stalkerSpawnInterval)) {

    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
      case 0: x = Math.random() * gameWidth; y = 0; break;
      case 1: x = gameWidth - 1; y = gameHeight - 1; break;
      case 2: x = Math.random() * gameWidth; y = gameHeight - 1; break;
      case 3: x = 0; y = Math.random() * gameHeight; break;
    }
    stalkers.push({ x, y, char: "Ξ" });
    lastStalkerSpawn = currentTime;
    playStalkerSpawnSound();
  }

  stalkers.forEach(stalker => {
    const dx = player.x - stalker.x;
    const dy = player.y - stalker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    stalker.x += (dx / dist) * stalkerSpeed;
    stalker.y += (dy / dist) * stalkerSpeed;

    if (Math.abs(player.x - stalker.x) < 1 && Math.abs(player.y - stalker.y) < 0.8) {
      playPlayerDeathSound();
      endGame();
      return;
    }
  });

  for (let i = enemies.length - 1; i >= 0; i--) {

    if (!enemies[i]) continue;

    const dx = player.x - enemies[i].x;
    const dy = player.y - enemies[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const currentEnemySpeed = currentEnemySpeedBase * (enemies[i].speedFactor || baseEnemySpeedFactor);
    enemies[i].x += (dx / dist) * currentEnemySpeed;
    enemies[i].y += (dy / dist) * currentEnemySpeed;

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (
        Math.abs(bullets[j].x - enemies[i].x) < 1 &&
        Math.abs(bullets[j].y - enemies[i].y) < 1
      ) {
        enemies[i].health--;
        bullets.splice(j, 1);
        playEnemyHitSound(); // Play hit sound *immediately* after impact

        
        
        if (enemies[i].health <= 0) {
          if (enemies[i].isBoss && enemies[i].ability === "charge") {
            const splitBossLeft = {
              x: enemies[i].x - 1,
              y: enemies[i].y,
              char: "<",
              health: Math.ceil(BOSS_TYPES.CHARGE.health / 2),
              speed: BOSS_TYPES.CHARGE.speed * 1.2,
              points: Math.ceil(BOSS_TYPES.CHARGE.points / 2),
              isBoss: true,
              direction: "left",
              ability: "split"
            };

            const splitBossRight = {
              x: enemies[i].x + 1,
              y: enemies[i].y,
              char: ">",
              health: Math.ceil(BOSS_TYPES.CHARGE.health / 2),
              speed: BOSS_TYPES.CHARGE.speed * 1.2,
              points: Math.ceil(BOSS_TYPES.CHARGE.points / 2),
              isBoss: true,
              direction: "right",
              ability: "split"
            };

            enemies.push(splitBossLeft, splitBossRight);
            score += enemies[i].points;
            enemies.splice(i, 1);
          } else {
            score += enemies[i].isBoss ? enemies[i].points : 10;
            enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    if (!enemies[i]) continue;

    if (enemies[i].isBoss && Date.now() - enemies[i].lastAbilityUse >= enemies[i].abilityInterval) {
      const boss = enemies[i];
      boss.lastAbilityUse = Date.now();

      switch (boss.ability) {
        case "shoot":

          if (!boss.shieldBullets) {
            boss.shieldBullets = [];
            boss.lastShieldExplosion = Date.now();
          }

          if (boss.shieldBullets.length === 0) {
            for (let i = 0; i < BOSS_TYPES.SHOOTER.shieldBulletCount; i++) {
              const angle = (i / BOSS_TYPES.SHOOTER.shieldBulletCount) * 2 * Math.PI;
              boss.shieldBullets.push({
                angle: angle,
                x: boss.x + Math.cos(angle) * BOSS_TYPES.SHOOTER.shieldRadius,
                y: boss.y + Math.sin(angle) * BOSS_TYPES.SHOOTER.shieldRadius
              });
            }
          }

          boss.shieldBullets.forEach(bullet => {
            bullet.angle += BOSS_TYPES.SHOOTER.rotationSpeed;
            bullet.x = boss.x + Math.cos(bullet.angle) * BOSS_TYPES.SHOOTER.shieldRadius;
            bullet.y = boss.y + Math.sin(bullet.angle) * BOSS_TYPES.SHOOTER.shieldRadius;

            enemyBullets.push({
              x: bullet.x,
              y: bullet.y,
              dx: 0,
              dy: 0,
              char: "*"
            });
          });

const shieldExplosionTime = Date.now();
          if (currentTime - boss.lastShieldExplosion >= BOSS_TYPES.SHOOTER.shieldExplosionInterval) {
            boss.lastShieldExplosion = currentTime;

            boss.shieldBullets.forEach(bullet => {
              const dx = (bullet.x - boss.x) / BOSS_TYPES.SHOOTER.shieldRadius;
              const dy = (bullet.y - boss.y) / BOSS_TYPES.SHOOTER.shieldRadius;
              enemyBullets.push({
                x: bullet.x,
                y: bullet.y,
                dx: dx,
                dy: dy,
                char: "*"
              });
            });

            boss.shieldBullets = [];
          }
          break;

        case "mine":

          if (boss.ability === "mine") {
            enemyBullets.push({
              x: boss.x,
              y: boss.y,
              dx: 0,
              dy: 0,
              char: "o"
            });
          }
          break;

        case "spawn":

          if (boss.ability === "spawn") {

            const currentTime = Date.now();
            if (!boss.isInvisible && currentTime - boss.lastVanishTime >= BOSS_TYPES.GHOST.vanishInterval) {
              boss.isInvisible = true;
              boss.vanishEndTime = currentTime + BOSS_TYPES.GHOST.vanishDuration;
              boss.lastVanishTime = currentTime;
            } else if (boss.isInvisible && currentTime > boss.vanishEndTime) {
              boss.isInvisible = false;
            }

            spawnEnemy();
          }
          break;

        case "charge":

          const dx = player.x - boss.x;
          const dy = player.y - boss.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          boss.x += (dx / dist) * BOSS_TYPES.CHARGE.speed;
          boss.y += (dy / dist) * BOSS_TYPES.CHARGE.speed;
          break;

        case "split":

          const verticalDist = player.y - boss.y;
          boss.y += (verticalDist / Math.abs(verticalDist)) * boss.speed;

          if (boss.direction === "left") {
            boss.x -= boss.speed;
            if (boss.x < 0) boss.x = gameWidth - 1;
          } else {
            boss.x += boss.speed;
            if (boss.x >= gameWidth) boss.x = 0;
          }
          break;

        case "shield":
          if (boss.ability === "shield") {
              const currentTime = Date.now();
              if (!boss.isShielded && currentTime - boss.lastShieldUse >= BOSS_TYPES.SHIELD.shieldInterval) {
                  boss.isShielded = true;
                  boss.shieldEndTime = currentTime + BOSS_TYPES.SHIELD.shieldDuration;
                  boss.lastShieldUse = currentTime;
              }

              if (boss.isShielded) {
                  if (currentTime > boss.shieldEndTime) {
                      boss.isShielded = false;
                  } else if (currentTime - boss.lastMineShot >= BOSS_TYPES.SHIELD.mineInterval) {
                      enemyBullets.push({ x: boss.x, y: boss.y, dx: 0, dy: 0, char: "o" });
                      boss.lastMineShot = currentTime;
                  }
              }
          }
          break;

        case "rapidFire":
          if (boss.ability === "rapidFire") {
              const currentTime = Date.now();
              if (!boss.isRapidFiring && currentTime - boss.lastRapidFireUse >= BOSS_TYPES.RAPID_FIRE.rapidFireInterval) {
                  boss.isRapidFiring = true;
                  boss.rapidFireEndTime = currentTime + BOSS_TYPES.RAPID_FIRE.rapidFireDuration;
                  boss.lastRapidFireUse = currentTime;
              }

              if (boss.isRapidFiring) {
                  if (currentTime > boss.rapidFireEndTime) {
                      boss.isRapidFiring = false;
                  } else {

                      const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                      const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3]; 
                      spreadAngles.forEach(angle => {
                          const finalAngle = baseAngle + angle;
                          const dx = Math.cos(finalAngle);
                          const dy = Math.sin(finalAngle);
                          enemyBullets.push({ 
                              x: boss.x,
                              y: boss.y,
                              dx: dx,
                              dy: dy,
                              char: "*"
                          });
                      });
                  }
              }
          }
          break;

        case "aoe":
          if (boss.ability === "aoe") {
              const currentTime = Date.now();
              if (currentTime - boss.lastAoeUse >= BOSS_TYPES.AOE.aoeInterval) {
                  boss.lastAoeUse = currentTime;
                  const bulletCount = BOSS_TYPES.AOE.aoeBulletCount;
                  const bulletSpeed = BOSS_TYPES.AOE.aoeBulletSpeed;

                  for (let j = 0; j < bulletCount; j++) {
                      const angle = (j / bulletCount) * 2 * Math.PI;
                      enemyBullets.push({
                          x: boss.x,
                          y: boss.y,
                          dx: Math.cos(angle) * bulletSpeed,
                          dy: Math.sin(angle) * bulletSpeed,
                          char: "o"
                      });
                  }
              }
          }
          break;
      }
    }

    if (
      i >= 0 &&
      Math.abs(player.x - enemies[i].x) < 0.8 &&
      Math.abs(player.y - enemies[i].y) < 0.8
    ) {
      endGame();
      return;
    }
  }

  if (Math.random() < currentSpawnRate) {
    spawnEnemy();
  }

  drawGame();
}

function drawGame() {
  let screen = Array(gameHeight)
    .fill()
    .map(() => Array(gameWidth).fill(" "));

  bullets.forEach((bullet) => {
    const x = Math.floor(bullet.x);
    const y = Math.floor(bullet.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-bullet)">*</span>`;
    }
  });

  enemyBullets.forEach((bullet) => {
    const x = Math.floor(bullet.x);
    const y = Math.floor(bullet.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-enemy-bullet)">${bullet.char}</span>`;
    }
  });

  stalkers.forEach((stalker) => {
    const x = Math.floor(stalker.x);
    const y = Math.floor(stalker.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-stalker); animation: pulse 2s infinite;">${stalker.char}</span>`;
    }
  });

  mines.forEach((mine) => {
    const x = Math.floor(mine.x);
    const y = Math.floor(mine.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      screen[y][x] = `<span style="color: var(--ctp-enemy-bullet)">${mine.char}</span>`;
    }
  });

  enemies.forEach((enemy) => {

    if (enemy.isBoss && enemy.ability === "spawn" && enemy.isInvisible) {
      return;
    }

    const x = Math.floor(enemy.x);
    const y = Math.floor(enemy.y);
    if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight) {
      const enemyColors = ["--ctp-enemy1", "--ctp-enemy2", "--ctp-enemy3"];
      const colorIndex = enemy.isElite ? 1 : enemy.type; 
      screen[y][x] = `<span style="color: var(${enemyColors[colorIndex]})">${
        enemy.char
      }</span>`;
      if (enemy.isBoss && enemy.isShielded) { 
        screen[y][x] = `<span style="color: var(--ctp-red); animation: blink-shield 1s step-end infinite;">${enemy.char}</span>`; 
      }
    }
  });

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

  let statusText = `<span class="status-text">Score: ${score} | Wave: ${wave}</span>`;
  statusText.split("").forEach((char, i) => {
    if (i < gameWidth) screen[0][i] = char;
  });

  document.getElementById("game-screen").innerHTML = screen
    .map((row) => row.join(""))
    .join("<br>");
}

function endGame() {
  gameState = "end";
  clearInterval(gameLoop);
  playPlayerDeathSound();

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

  localStorage.setItem("asciitron-games-played", gamesPlayed + 1);
  localStorage.setItem("asciitron-total-score", totalScore + score);

  document.getElementById("game-screen").style.display = "none";
  document.getElementById("game-screen").classList.remove("playing");
  document.getElementById("final-score").textContent = score;
  document.getElementById("end-screen").style.display = "block";
  document.getElementById("high-score-display").style.display = "none";

  const savedCredentials = localStorage.getItem("asciitron-credentials");
  if (savedCredentials) {
    document.getElementById("player-credentials").value = savedCredentials;
  }

  getLeaderboard().then(() => {
    document.getElementById("scores-popup").style.display = "block";
  });
}

document.addEventListener("keydown", (e) => {
  if (gameState === "start") {
    if (e.code === "Space") {
      setTimeout(startGame, 100); 
      return;
    } else if (e.code === "KeyT") {
      const modalScores = document.getElementById("modal-scores");
      const modalInstructions = document.getElementById("modal-instructions");
      const modalStats = document.getElementById("modal-stats");

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

      modalScores.style.display = "none";
      modalStats.style.display = "none";

      modalInstructions.style.display =
        modalInstructions.style.display === "block" ? "none" : "block";
      return;
    } else if (e.code === "KeyU") {
      const modalStats = document.getElementById("modal-stats");
      const modalScores = document.getElementById("modal-scores");
      const modalInstructions = document.getElementById("modal-instructions");

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

        case "ArrowUp":
          bullets.push({ x: player.x, y: player.y, dx: 0, dy: -1 });
          playPlayerShootSound(); // Add this line
          break;
        case "ArrowDown":
          bullets.push({ x: player.x, y: player.y, dx: 0, dy: 1 });
          playPlayerShootSound(); // Add this line
          break;
        case "ArrowLeft":
          bullets.push({ x: player.x, y: player.y, dx: -1, dy: 0 });
          playPlayerShootSound(); // Add this line
          break;
        case "ArrowRight":
          bullets.push({ x: player.x, y: player.y, dx: 1, dy: 0 });
          playPlayerShootSound(); // Add this line
          break;
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (gameState === "playing") {
    switch (e.code) {

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
      throw new Error(result.error || "Failed to submit score");
    }
    await getLeaderboard(); 
  } catch (error) {
    console.error("Error submitting score:", error);
    alert("Failed to submit score. Please try again.");
  }
}

function updateModalScores() {
  const modalContent = document.getElementById("modal-scores-content");

  modalContent.innerHTML = document.getElementById("scores").innerHTML;
}

async function getLeaderboard() {
  try {
    const response = await fetch(
      "https://asciitron-api.leefamous.workers.dev/scores",
      { headers: { "Content-Type": "application/json" } }
    );
    const scores = await response.json();
    console.log("Leaderboard response:", scores);
    updateLeaderboardDisplay(scores); 
    updateScoresPopup(scores); 
    return scores;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
}

function updateLeaderboardDisplay(scores) {
  console.log("Updating leaderboard with", scores.length, "scores.");
  const catppuccinColors = [
    "#f5c2e7", 
    "#cba6f7", 
    "#89b4fa", 
    "#94e2d5", 
    "#a6e3a1", 
    "#fab387", 
    "#f38ba8", 
    "#eba0ac", 
  ];
  const scoresDiv = document.getElementById("scores");
  if (scores && scores.length > 0) {

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

function getColorFromTripcode(tripcode) {
  const catppuccinColors = [
    "#f5c2e7", 
    "#cba6f7", 
    "#89b4fa", 
    "#94e2d5", 
    "#a6e3a1", 
    "#fab387", 
    "#f38ba8", 
    "#eba0ac", 
  ];
  const colorIndex = tripcode.charCodeAt(0) % catppuccinColors.length;
  return catppuccinColors[colorIndex];
}

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

function saveScore() {

  if (document.getElementById("save-score-text").textContent === "[V] Score Saved!") {
    return;
  }

  const input = document.getElementById("player-credentials").value;
  if (!input) {
    showNotification("Please enter credentials in the format: Name#Password");
    return;
  }
  const [displayName, password] = input.split("#");

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

      let rankingMessage;
      if (result.position > 100) {
        rankingMessage = "Try Again!";
      } else if (result.position <= 10) {
        rankingMessage = `Top 10! (Rank ${result.position})`;
      } else {
        rankingMessage = `Top ${result.position}!`;
      }
      showNotification(rankingMessage);

      const saveText = document.getElementById("save-score-text");
      saveText.textContent = "[V] Score Saved!";
      saveText.style.opacity = "0.3";
      saveText.style.cursor = "default";
      saveText.style.pointerEvents = "none";
    })
    .catch((error) => {
      console.error("Error saving score:", error);

      if (error.response) {
        error.response.json().then(data => {
          showNotification(data.error || "Failed to save score. Please try again.");
        });
      } else {
        showNotification(error.message || "Failed to save score. Please try again.");
      }
    });
}

function restartGame() {
  document.getElementById("end-screen").style.display = "none";
  document.getElementById("player-credentials").value = "";

  const saveText = document.getElementById("save-score-text");
  saveText.textContent = "[V] Save Score";
  saveText.style.opacity = "1";
  document.getElementById("scores-popup").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
  gameState = "start";
}

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