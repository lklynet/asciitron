# ASCIItron 🕹️

ASCIItron is a retro-style ASCII shooter game built with vanilla JavaScript. Navigate through waves of enemies, rack up high scores, and compete for the top spot on the global leaderboard.

## 🎮 Gameplay

- Use **WASD** keys to move your character (@)
- Use **Arrow Keys** to shoot in four directions
- Survive increasingly difficult waves of enemies
- Collect points by destroying enemies
- Compare your scores with other players globally

## 🛠️ Technical Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare KV Storage
- **Hosting:** Cloudflare Pages
- **Design:** Catppuccin Mocha Color Scheme

## 🎯 Features

- **Responsive ASCII Graphics:** Pure text-based visuals that work across devices
- **Global Leaderboard:** Compete with players worldwide
- **Persistent Stats:** Track your highest score, waves survived, and total games
- **Secure Score Submission:** Username/password system with SHA-256 hashing
- **Progressive Difficulty:** Increasing challenge with each wave
- **Keyboard Controls:** Full keyboard navigation throughout the game

## 🚀 Getting Started

1. Visit [https://asciitron.lkly.net](https://asciitron.lkly.net)
2. Press **Space** to start the game
3. Use **WASD** to move and **Arrow Keys** to shoot
4. Create credentials (username#password) to save your scores

## 🎨 Design

The game uses the Catppuccin Mocha color scheme for a cohesive retro aesthetic:

- Player: Blue
- Enemies: Red, Peach, Green
- Bullets: White
- UI Elements: Various Catppuccin colors

## 🔧 Development

### Project Structure

```
asciitron/
├── index.html      # Main game interface and UI
├── styles.css      # Catppuccin theme and animations
├── scripts.js      # Core game logic and mechanics
└── worker/         # Backend API
    └── worker.js   # Score handling and leaderboard
```

### Local Development

1. Clone the repository
2. Serve the files using a local HTTP server (e.g., `python -m http.server`)
3. No build step required - edit and refresh

## �� Security

- Scores are saved using username#password format
- Passwords are hashed using SHA-256 before transmission
- Score submission is protected against spam
- Input validation on both client and server sides
- Usernames limited to 12 characters

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🐛 Known Issues

- Character movement needs fine-tuning at screen edges
- ASCII art rendering may vary slightly between browsers
- Some mobile browsers may have keyboard input issues

## 📫 Contact

For issues, suggestions, or contributions, please open an issue on GitHub.

---
