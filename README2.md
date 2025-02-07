# AsciiTron

## Game Overview

AsciiTron is a fast-paced, ASCII art-based space shooter game playable directly in the browser.  Defend against waves of increasingly challenging enemies, including unique bosses, to achieve the highest score.

## Table of Contents

1.  [Game Mechanics](https://www.google.com/url?sa=E&source=gmail&q=#game-mechanics)
      * [Player Controls](https://www.google.com/url?sa=E&source=gmail&q=#player-controls)
      * [Shooting](https://www.google.com/url?sa=E&source=gmail&q=#shooting)
      * [Enemy Movement](https://www.google.com/url?sa=E&source=gmail&q=#enemy-movement)
      * [Enemy Types](https://www.google.com/url?sa=E&source=gmail&q=#enemy-types)
          * [Basic Enemies](https://www.google.com/url?sa=E&source=gmail&q=#basic-enemies)
          * [Elite Enemies](https://www.google.com/url?sa=E&source=gmail&q=#elite-enemies)
          * [Stalkers](https://www.google.com/url?sa=E&source=gmail&q=#stalkers)
          * [Bosses](https://www.google.com/url?sa=E&source=gmail&q=#bosses)
      * [Waves and Progression](https://www.google.com/url?sa=E&source=gmail&q=#waves-and-progression)
          * [Wave Structure](https://www.google.com/url?sa=E&source=gmail&q=#wave-structure)
          * [Breather Waves](https://www.google.com/url?sa=E&source=gmail&q=#breather-waves)
          * [Elite Waves](https://www.google.com/url?sa=E&source=gmail&q=#elite-waves)
          * [Boss Waves](https://www.google.com/url?sa=E&source=gmail&q=#boss-waves)
      * [Scoring](https://www.google.com/url?sa=E&source=gmail&q=#scoring)
2.  [Game Rules](https://www.google.com/url?sa=E&source=gmail&q=#game-rules)
      * [Objective](https://www.google.com/url?sa=E&source=gmail&q=#objective)
      * [Win Condition](https://www.google.com/url?sa=E&source=gmail&q=#win-condition)
      * [Lose Condition](https://www.google.com/url?sa=E&source=gmail&q=#lose-condition)
3.  [Game Entities](https://www.google.com/url?sa=E&source=gmail&q=#game-entities)
      * [Player](https://www.google.com/url?sa=E&source=gmail&q=#player)
      * [Enemies](https://www.google.com/url?sa=E&source=gmail&q=#enemies-entity)
      * [Bullets](https://www.google.com/url?sa=E&source=gmail&q=#bullets)
      * [Enemy Bullets](https://www.google.com/url?sa=E&source=gmail&q=#enemy-bullets)
      * [Stalkers](https://www.google.com/url?sa=E&source=gmail&q=#stalkers-entity)
4.  [Game Parameters and Variables](https://www.google.com/url?sa=E&source=gmail&q=#game-parameters-and-variables)
      * [Spawn Rates](https://www.google.com/url?sa=E&source=gmail&q=#spawn-rates)
      * [Enemy Speed](https://www.google.com/url?sa=E&source=gmail&q=#enemy-speed)
      * [Bullet Speed](https://www.google.com/url?sa=E&source=gmail&q=#bullet-speed)
      * [Stalker Parameters](https://www.google.com/url?sa=E&source=gmail&q=#stalker-parameters)
      * [Breather Wave Parameters](https://www.google.com/url?sa=E&source=gmail&q=#breather-wave-parameters)
      * [Boss Parameters](https://www.google.com/url?sa=E&source=gmail&q=#boss-parameters)
5.  [Game States](https://www.google.com/url?sa=E&source=gmail&q=#game-states)
6.  [User Interface (UI)](https://www.google.com/url?sa=E&source=gmail&q=#user-interface-ui)
      * [Start Screen](https://www.google.com/url?sa=E&source=gmail&q=#start-screen)
      * [Game Screen](https://www.google.com/url?sa=E&source=gmail&q=#game-screen)
      * [End Screen](https://www.google.com/url?sa=E&source=gmail&q=#end-screen)
      * [Modals](https://www.google.com/url?sa=E&source=gmail&q=#modals)
          * [Scores Modal](https://www.google.com/url?sa=E&source=gmail&q=#scores-modal)
          * [Instructions Modal](https://www.google.com/url?sa=E&source=gmail&q=#instructions-modal)
          * [Stats Modal](https://www.google.com/url?sa=E&source=gmail&q=#stats-modal)
      * [Leaderboard](https://www.google.com/url?sa=E&source=gmail&q=#leaderboard)
      * [High Score Display](https://www.google.com/url?sa=E&source=gmail&q=#high-score-display)
      * [Notification](https://www.google.com/url?sa=E&source=gmail&q=#notification)
7.  [Input and Controls](https://www.google.com/url?sa=E&source=gmail&q=#input-and-controls)
8.  [Score Saving and Leaderboard](https://www.google.com/url?sa=E&source=gmail&q=#score-saving-and-leaderboard)
      * [Saving Scores](https://www.google.com/url?sa=E&source=gmail&q=#saving-scores)
      * [Leaderboard Functionality](https://www.google.com/url?sa=E&source=gmail&q=#leaderboard-functionality)
      * [Tripcodes and Color Coding](https://www.google.com/url?sa=E&source=gmail&q=#tripcodes-and-color-coding)
9.  [Game Progression Flowchart](https://www.google.com/url?sa=E&source=gmail&q=#game-progression-flowchart)
10. [Customization and Modification](https://www.google.com/url?sa=E&source=gmail&q=#customization-and-modification)
11. [Contributing](https://www.google.com/url?sa=E&source=gmail&q=#contributing)

-----

## 1\. Game Mechanics

AsciiTron is a single-player, top-down shooter where you control a player character represented by the `@` symbol, defending against waves of enemies. The game is rendered using ASCII characters in a fixed-size grid.

### Player Controls

  * **Movement:**
      * `W`: Move Up
      * `S`: Move Down
      * `A`: Move Left
      * `D`: Move Right
  * **Shooting:**
      * `Arrow Up`: Shoot Up
      * `Arrow Down`: Shoot Down
      * `Arrow Left`: Shoot Left
      * `Arrow Right`: Shoot Right

### Shooting

  * The player can shoot bullets (`*` symbol) in four directions: up, down, left, and right.
  * Bullets travel at a `baseBulletSpeed` of `0.8` units per game update.
  * Pressing an arrow key fires a bullet in the corresponding direction.
  * Bullets are destroyed when they go off-screen or hit an enemy.

### Enemy Movement

  * Enemies generally move towards the player.
  * Enemy speed is determined by `enemySpeed` and a `speedFactor` that varies by enemy type and wave progression.
  * `enemySpeed` starts at `initialEnemySpeed` (`0.18`) and increases by `spawnRateIncrease` (`1.10`) each wave, up to a `maxEnemySpeed` (`0.6`).
  * Different enemy types have different `speedFactor` values defined in `ENEMY_SPEED_FACTORS`:
      * `&`: `0.8` (Slower)
      * `%`: `1.2` (Faster)
      * `#`: `1.0` (Normal)

### Enemy Types

The game features several types of enemies with varying characteristics:

#### Basic Enemies

  * Represented by characters: `&`, `%`, `#`.
  * Health: `1`
  * Speed: Based on `enemySpeed` and `ENEMY_SPEED_FACTORS`.
  * Types (`0`, `1`, `2`) determine their color in the game.
  * Point Value: `10` points per enemy.

#### Elite Enemies

  * Spawn during "Elite Waves" (after breather waves).
  * Represented by uppercase versions of basic enemy characters: `&` becomes `&`, `%` becomes `%`, `#` becomes `#`.
  * Higher speed due to `eliteEnemySpeedFactorIncrease` (`1.2`) multiplier applied to their `speedFactor`.
  * Spawn chance during elite waves is `40%`.

#### Stalkers

  * Represented by the character `Ξ`.
  * Spawn periodically after a certain time into each wave.
  * `stalkerSpawnTime` starts at `initialStalkerSpawnTime` (`45000` milliseconds) and decreases by `5%` each wave (minimum `10000` milliseconds).
  * `stalkerSpawnInterval` starts at `stalkerSpawnIntervalTime` (`15000` milliseconds) and decreases by `5%` each wave (minimum `5000` milliseconds).
  * Move directly towards the player at `stalkerSpeed` (`0.05`).
  * Touching a stalker results in game over.

#### Bosses

Bosses are special, more challenging enemies that appear in boss waves and have unique abilities. Boss types are defined in `BOSS_TYPES`:

  * **TANK (`$$`)**

      * Health: `25`
      * Speed: `0.05`
      * Points: `20`
      * Ability: `mine` - Periodically drops enemy bullets (`o`) at its location.
      * Shoot Interval: `3000` milliseconds.

  * **SHOOTER (`@@`)**

      * Health: `15`
      * Speed: `0.1`
      * Points: `20`
      * Ability: `shoot` - Creates a rotating shield of bullets (`*`) around itself that periodically explodes, firing bullets outwards.
      * Shoot Interval: `3000` milliseconds (for shield creation and explosions).
      * Shield Radius: `3` units.
      * Shield Bullet Count: `8` bullets.
      * Shield Explosion Interval: `5000` milliseconds.
      * Rotation Speed: `0.1` radians per update.

  * **GHOST (`%%`)**

      * Health: `20`
      * Speed: `0.15`
      * Points: `20`
      * Ability: `spawn` - Periodically vanishes and spawns a regular enemy.
      * Spawn Interval: `2000` milliseconds (time between spawns).
      * Vanish Interval: `3000` milliseconds (time before vanishing).
      * Vanish Duration: `2000` milliseconds (duration of invisibility).

  * **CHARGE (`><`)**

      * Health: `20`
      * Speed: `0.2`
      * Points: `25`
      * Ability: `charge` - Periodically charges towards the player at high speed. Upon death, splits into two smaller bosses (`<` and `>`).
      * Charge Interval: `3000` milliseconds.
      * Charge Speed Factor: `8` (multiplier to its base speed during charge).
      * Charge Distance: `15` units (distance to maintain before charging).

  * **SHIELD (`[]`)**

      * Health: `30`
      * Speed: `0.08`
      * Points: `25`
      * Ability: `shield` - Periodically activates a shield, becoming invulnerable and dropping mines (`o`).
      * Shield Interval: `5000` milliseconds (time between shield activations).
      * Shield Duration: `2000` milliseconds (duration of shield).
      * Mine Interval: `2000` milliseconds (time between mine drops during shield).

  * **RAPID\_FIRE (`==`)**

      * Health: `12`
      * Speed: `0.12`
      * Points: `20`
      * Ability: `rapidFire` - Periodically fires a spread of bullets (`*`) towards the player.
      * Rapid Fire Interval: `2000` milliseconds (time between rapid fire bursts).
      * Rapid Fire Duration: `1500` milliseconds (duration of rapid fire).

  * **AOE (`OO`)**

      * Health: `28`
      * Speed: `0.06`
      * Points: `30`
      * Ability: `aoe` - Periodically releases a ring of bullets (`o`) in all directions.
      * AOE Interval: `7000` milliseconds (time between AOE attacks).
      * AOE Bullet Speed: `0.5` units per update.
      * AOE Bullet Count: `12` bullets per ring.

### Waves and Progression

The game progresses in waves. Each wave increases the difficulty by increasing enemy spawn rate and speed.

#### Wave Structure

  * Each wave starts with enemies spawning from random sides of the game area.
  * The number of enemies spawned in a wave increases with the wave number.
  * After each wave, `spawnRate` and `enemySpeed` increase, making subsequent waves more challenging.
  * Waves are numbered, starting from wave `1`. Wave `0` is considered the initial state before wave 1 begins.

#### Breather Waves

  * Occur after every boss wave and after wave `0`.
  * Marked by `breatherWaveActive` being true.
  * Reduced enemy spawn rate (`breatherWaveSpawnRateFactor` of `0.5`).
  * Reduced enemy speed (`breatherWaveEnemySpeedFactor` of `0.8`).
  * `breatherWaveDuration` is `5000` milliseconds.
  * Designed to give the player a short respite after intense waves.

#### Elite Waves

  * Immediately follow breather waves (`eliteWaveActive` becomes true after a breather wave ends).
  * During elite waves, there's a chance (`40%`) for enemies to spawn as "elite" versions, which are faster and visually distinct (uppercase characters).

#### Boss Waves

  * Occur every 5 waves (wave `5`, `10`, `15`, etc.).
  * Multiple bosses (`spawnMultipleBosses`) are spawned at the beginning of boss waves, based on the wave number (`Math.floor(waveNumber/5)` bosses).
  * Boss waves are immediately followed by breather waves.

### Scoring

  * Score starts at `0`.
  * Killing a basic enemy adds `10` points to the score.
  * Killing a boss enemy adds points based on the `points` value defined in `BOSS_TYPES` (e.g., `20`, `25`, or `30` points).
  * Score is displayed in the top left corner of the game screen.
  * High score and high wave are tracked and stored in local storage.

## 2\. Game Rules

### Objective

The objective of AsciiTron is to survive as many waves of enemies as possible and achieve the highest score.

### Win Condition

There is no explicit "win" condition in AsciiTron. The game is about survival and achieving a high score. Players continue playing until they lose.

### Lose Condition

The game ends when:

  * The player collides with an enemy bullet (`*` or `o`).
  * The player collides with a stalker (`Ξ`).
  * The player collides with an enemy (basic or boss).

When the game ends, the `endGame()` function is called, which:

  * Sets `gameState` to "end".
  * Clears the game loop interval.
  * Saves the score and wave to local storage if they are new high scores.
  * Displays the end screen (`#end-screen`) with the final score.
  * Fetches and displays the leaderboard.

## 3\. Game Entities

### Player

  * Represented by the character `@`.
  * Position: `player.x`, `player.y` (coordinates on the game grid).
  * Movement vectors: `player.dx`, `player.dy` (direction of movement, -1, 0, or 1 for each axis).
  * Shooting direction vectors: `player.shootDx`, `player.shootDy` (initially set to shoot upwards).
  * Controlled by player input (W, A, S, D for movement, arrow keys for shooting).

### Enemies (Entity)

  * Represented by characters: `&`, `%`, `#`, uppercase versions for elites, and boss-specific characters (`$$`, `@@`, `%%`, `><`, `[]`, `==`, `OO`).
  * Properties:
      * `x`, `y`: Position.
      * `char`: Character representation.
      * `type`: Basic enemy type (0, 1, 2 for color).
      * `health`: Hit points.
      * `isBoss`: Boolean, indicates if it's a boss.
      * `speedFactor`: Speed multiplier.
      * `isElite`: Boolean, indicates if it's an elite enemy.
      * Boss-specific properties (e.g., `ability`, `abilityInterval`, `shieldBullets`, `isShielded`, etc.) are added dynamically based on the boss type.
  * Spawned by `spawnEnemy()` function.
  * Move towards the player in `updateGame()` function.
  * Destroyed when their `health` reaches `0` after colliding with player bullets.

### Bullets

  * Represented by the character `*`.
  * Properties:
      * `x`, `y`: Position.
      * `dx`, `dy`: Direction of movement.
  * Spawned when the player presses an arrow key.
  * Move in the specified direction in `updateGame()` function.
  * Destroyed when they go off-screen or hit an enemy.

### Enemy Bullets

  * Represented by characters: `*` (from SHOOTER and RAPID\_FIRE bosses), `o` (from TANK, SHIELD, and AOE bosses).
  * Properties:
      * `x`, `y`: Position.
      * `dx`, `dy`: Direction of movement.
      * `char`: Character representation (`*` or `o`).
  * Spawned by boss abilities in `updateGame()` function.
  * Move in the specified direction in `updateGame()` function.
  * Destroyed when they go off-screen.
  * Collision with enemy bullets results in game over.

### Stalkers (Entity)

  * Represented by the character `Ξ`.
  * Properties:
      * `x`, `y`: Position.
      * `char`: Character representation.
  * Spawned periodically by the game logic in `updateGame()` function.
  * Move directly towards the player in `updateGame()` function.
  * Collision with stalkers results in game over.

## 4\. Game Parameters and Variables

### Spawn Rates

  * `initialSpawnRate`: `0.015` (Initial probability of an enemy spawning per game update).
  * `spawnRateIncrease`: `1.10` (Multiplier for `spawnRate` after each wave).
  * `maxSpawnRate`: `0.08` (Maximum `spawnRate` value).
  * `breatherWaveSpawnRateFactor`: `0.5` (Factor to reduce `spawnRate` during breather waves).

### Enemy Speed

  * `initialEnemySpeed`: `0.18` (Initial base enemy speed).
  * `enemySpeedIncrease`: `1.05` (Multiplier for `enemySpeed` after each wave).
  * `maxEnemySpeed`: `0.6` (Maximum `enemySpeed` value).
  * `baseEnemySpeedFactor`: `1.0` (Default speed factor for basic enemies).
  * `eliteEnemySpeedFactorIncrease`: `1.2` (Multiplier to `speedFactor` for elite enemies).
  * `breatherWaveEnemySpeedFactor`: `0.8` (Factor to reduce `enemySpeed` during breather waves).

### Bullet Speed

  * `baseBulletSpeed`: `0.8` (Speed of player and enemy bullets).

### Stalker Parameters

  * `baseStalkerSpeed`: `0.05` (Speed of stalker enemies).
  * `initialStalkerSpawnTime`: `45000` milliseconds (Initial time before the first stalker spawns in a wave).
  * `stalkerSpawnIntervalTime`: `15000` milliseconds (Initial interval between stalker spawns after the first one).
  * `stalkerSpawnTime` and `stalkerSpawnInterval` decrease by `5%` each wave (with minimum limits).

### Breather Wave Parameters

  * `breatherWaveDuration`: `5000` milliseconds (Duration of breather waves).

### Boss Parameters

Boss parameters are defined in the `BOSS_TYPES` constant. See the [Bosses](https://www.google.com/url?sa=E&source=gmail&q=#bosses) section for details on each boss type's parameters like `health`, `speed`, `points`, `shootInterval`, `ability`, etc.

## 5\. Game States

The game has the following states, controlled by the `gameState` variable:

  * `"start"`: Start screen state. Displayed when the game is initially loaded or after restarting.
  * `"playing"`: Game is actively running. The `updateGame()` loop is active, and the player can control the game.
  * `"end"`: Game over state. Displayed when the player loses. Game loop is stopped.

## 6\. User Interface (UI)

The game UI is primarily managed through HTML elements and CSS styling.

### Start Screen

  * Displayed when `gameState` is `"start"` (`#start-screen`).
  * Contains:
      * Game title.
      * "Press [Spacebar] to Start" prompt.
      * Options to view scores (`[T]`), instructions (`[Y]`), and stats (`[U]`).

### Game Screen

  * Displayed when `gameState` is `"playing"` (`#game-screen`).
  * ASCII art game grid is rendered within this element using `<br>` for rows and `<span>` for characters with styling.
  * Displays the game world, player, enemies, bullets, and stalkers.
  * Shows the current `score` and `wave` in the top line.
  * Leaderboard (`#leaderboard`) and high score display (`#high-score-display`) are visible during gameplay.

### End Screen

  * Displayed when `gameState` is `"end"` (`#end-screen`).
  * Contains:
      * "Game Over" message.
      * Final score (`#final-score`).
      * Input field for player credentials (`#player-credentials`) to save score.
      * "Save Score" button (`#save-score-text` - triggered by `[V]`).
      * "Restart Game" button (`[R]`).

### Modals

Modals are pop-up overlays that appear on top of the start screen.

#### Scores Modal

  * Displayed when `[T]` is pressed on the start screen (`#modal-scores`).
  * Shows the leaderboard scores in `#modal-scores-content`, populated from `#scores`.
  * Can be toggled on/off.

#### Instructions Modal

  * Displayed when `[Y]` is pressed on the start screen (`#modal-instructions`).
  * Provides basic game instructions.
  * Can be toggled on/off.

#### Stats Modal

  * Displayed when `[U]` is pressed on the start screen (`#modal-stats`).
  * Shows game statistics:
      * High Score (`#stat-highscore`).
      * High Wave (`#stat-highwave`).
      * Games Played (`#stat-games-played`).
      * Total Score (`#stat-total-score`).
  * Can be toggled on/off.

### Leaderboard

  * Displayed in `#leaderboard` (visible during gameplay and on the end screen).
  * Populated with scores fetched from the server using `getLeaderboard()`.
  * Uses `#scores` element to display the list of scores.
  * Highlights the highest score in `#display-high-score`.

### High Score Display

  * Displayed in `#high-score-display` (visible during gameplay).
  * Shows the current high score from local storage.

### Notification

  * Displayed in `#notification`.
  * Used to show temporary messages to the player (e.g., "Score Saved\!", "Invalid format").
  * Appears with opacity animation and fades out after 2 seconds.

## 7\. Input and Controls

The game uses keyboard input for controls. Input events are handled by event listeners attached to the `document`.

  * **Start Screen (`gameState === "start"`):**

      * `Spacebar`: Start Game (`startGame()`).
      * `T`: Toggle Scores Modal.
      * `Y`: Toggle Instructions Modal.
      * `U`: Toggle Stats Modal.

  * **End Screen (`gameState === "end"`):**

      * `V`: Save Score (`saveScore()`).
      * `R`: Restart Game (`restartGame()`).

  * **Playing State (`gameState === "playing"`):**

      * `W`: Move Player Up (`player.dy = -1`).
      * `S`: Move Player Down (`player.dy = 1`).
      * `A`: Move Player Left (`player.dx = -1`).
      * `D`: Move Player Right (`player.dx = 1`).
      * `Arrow Up`: Shoot Up.
      * `Arrow Down`: Shoot Down.
      * `Arrow Left`: Shoot Left.
      * `Arrow Right`: Shoot Right.
      * Key release events (`keyup`) for `W`, `S`, `A`, `D` set `player.dx` and `player.dy` back to `0` to stop movement.

## 8\. Score Saving and Leaderboard

### Saving Scores

  * Scores are saved to a remote leaderboard using an API (`https://asciitron-api.leefamous.workers.dev/scores`).
  * Players can save their score on the end screen by pressing `[V]` or clicking "Save Score".
  * Saving score requires entering credentials in the format `Name#Password` in the input field (`#player-credentials`).
  * The password is hashed using SHA-256 in the browser before being sent to the server.
  * Usernames are limited to 1-12 characters.
  * After successful score submission, a notification is shown, and the leaderboard is updated.
  * Player credentials are saved in local storage (`asciitron-credentials`) for convenience.

### Leaderboard Functionality

  * The leaderboard is fetched from the API endpoint (`https://asciitron-api.leefamous.workers.dev/scores`) using `getLeaderboard()`.
  * The leaderboard is updated on game load, after score submission, and when the scores modal is opened.
  * The leaderboard displays the top scores, player names, and "tripcodes".
  * The highest score entry is highlighted in the `#display-high-score` element.
  * The full leaderboard (top 100) is displayed in the `#scores` element and in the scores modal (`#modal-scores-content`).
  * The scores popup (`#scores-popup`) on the end screen shows the top 10 scores.

### Tripcodes and Color Coding

  * Each leaderboard entry includes a "tripcode" (a hash of the password).
  * Tripcodes are used to generate a unique color for each player's name on the leaderboard using `getColorFromTripcode()`.
  * The color is derived from the first character's ASCII code of the tripcode, ensuring consistent color for the same tripcode.
  * Catppuccin color palette is used for the name colors.

## 9\. Game Progression Flowchart

```mermaid
graph LR
    A[Start Screen] --> B{Spacebar Pressed?};
    B -- Yes --> C[Start Game (startGame())];
    B -- No (T) --> D[Toggle Scores Modal];
    B -- No (Y) --> E[Toggle Instructions Modal];
    B -- No (U) --> F[Toggle Stats Modal];
    C --> G[Game Playing (gameState="playing")];
    G --> H{Game Update Loop (updateGame())};
    H -- Player Loses --> I[End Game (endGame())];
    H -- No Lose --> H;
    I --> J[End Screen (gameState="end")];
    J --> K{V Pressed?};
    K -- Yes --> L[Save Score (saveScore())];
    K -- No (R) --> M[Restart Game (restartGame())];
    M --> A;
    L --> J;
    D --> A;
    E --> A;
    F --> A;
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px
    style J fill:#fcc,stroke:#333,stroke-width:2px
```

## 10\. Customization and Modification

The game parameters are largely defined at the beginning of the code, making it relatively easy to customize the game difficulty and behavior.  Modifiable parameters include:

  * **Spawn Rates:** `initialSpawnRate`, `spawnRateIncrease`, `maxSpawnRate`, `breatherWaveSpawnRateFactor`.
  * **Enemy Speed:** `initialEnemySpeed`, `enemySpeedIncrease`, `maxEnemySpeed`, `baseEnemySpeedFactor`, `eliteEnemySpeedFactorIncrease`, `breatherWaveEnemySpeedFactor`, `ENEMY_SPEED_FACTORS`.
  * **Bullet Speed:** `baseBulletSpeed`.
  * **Stalker Parameters:** `baseStalkerSpeed`, `initialStalkerSpawnTime`, `stalkerSpawnIntervalTime`.
  * **Breather Wave Parameters:** `breatherWaveDuration`.
  * **Boss Parameters:**  All parameters within the `BOSS_TYPES` constant, including health, speed, abilities, intervals, bullet counts, etc.
  * **Game Grid Size:** `gameWidth`, `gameHeight`.

Modifying these variables directly in the code will alter the gameplay experience. For example:

  * Increasing `spawnRateIncrease` and `enemySpeedIncrease` will make the game harder faster.
  * Decreasing `initialSpawnRate` and `initialEnemySpeed` will make the beginning of the game easier.
  * Adjusting boss parameters can change the difficulty and behavior of boss waves significantly.

## 11\. Contributing

Contributions to AsciiTron are welcome\! If you'd like to contribute, please consider the following:

  * **Bug Fixes:** Report bugs and submit pull requests with fixes.
  * **New Enemy Types:** Design and implement new enemy behaviors and boss abilities.
  * **Gameplay Enhancements:** Suggest and implement improvements to the game mechanics, UI, or features.
  * **Code Refactoring:** Improve code readability, efficiency, and maintainability.

When contributing, please follow these guidelines:

  * **Code Style:** Maintain consistent code style and formatting.
  * **Testing:** Ensure your changes are tested and do not introduce new issues.
  * **Documentation:** Update the README and code comments as needed to reflect your changes.

To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, descriptive commit messages.
4.  Submit a pull request to the main repository.

-----

This README provides a comprehensive overview of the AsciiTron game code, its mechanics, rules, and structure. Use this document as a guide to understand the game and contribute to its development.

```
```