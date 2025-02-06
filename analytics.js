// Plausible Analytics Event Tracking

// Initialize Plausible function
window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };

class GameAnalytics {
    constructor() {
        this.gameStartTime = null;
        this.shotsFired = 0;
        this.enemiesKilled = 0;
        this.wavesCompleted = 0;
        this.isGameActive = false;

        // Bind event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Game Start
        document.addEventListener('gameStart', () => {
            this.onGameStart();
        });

        // Game End
        document.addEventListener('gameEnd', () => {
            this.onGameEnd();
        });

        // Shot Fired
        document.addEventListener('shotFired', () => {
            this.onShotFired();
        });

        // Enemy Killed
        document.addEventListener('enemyKilled', () => {
            this.onEnemyKilled();
        });

        // Wave Completed
        document.addEventListener('waveCompleted', () => {
            this.onWaveCompleted();
        });
    }

    onGameStart() {
        this.gameStartTime = Date.now();
        this.isGameActive = true;
        this.resetMetrics();

        // Track game start event with callback
        plausible('Game Started', {
            callback: () => console.log('Game start event tracked')
        });
    }

    onGameEnd() {
        if (!this.isGameActive) return;

        // Calculate time played in minutes
        const timePlayed = Math.round((Date.now() - this.gameStartTime) / 60000);

        // Track final metrics with proper event names and properties
        plausible('Time Played', {
            props: { minutes: timePlayed },
            callback: () => console.log('Time played event tracked')
        });
        
        plausible('Waves Completed', {
            props: { count: this.wavesCompleted },
            callback: () => console.log('Waves completed event tracked')
        });
        
        plausible('Shots Fired', {
            props: { count: this.shotsFired },
            callback: () => console.log('Shots fired event tracked')
        });
        
        plausible('Enemies Killed', {
            props: { count: this.enemiesKilled },
            callback: () => console.log('Enemies killed event tracked')
        });

        this.isGameActive = false;
    }

    onShotFired() {
        if (!this.isGameActive) return;
        this.shotsFired++;
    }

    onEnemyKilled() {
        if (!this.isGameActive) return;
        this.enemiesKilled++;
    }

    onWaveCompleted() {
        if (!this.isGameActive) return;
        this.wavesCompleted++;
    }

    resetMetrics() {
        this.shotsFired = 0;
        this.enemiesKilled = 0;
        this.wavesCompleted = 0;
    }
}

// Initialize analytics when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameAnalytics = new GameAnalytics();
});