// === MAIN GAME INITIALIZATION ===
// This file is responsible for creating the Phaser game instance.
// It references external scene files like GameplayScene.js

function initPhaserGame() {
    // === GAME CONFIGURATION ===
    const config = {
        type: Phaser.AUTO, // Automatically choose WebGL or Canvas (best option for browser)
        width: window.innerWidth, // Full browser width
        height: window.innerHeight, // Full browser height
        parent: "game-container",
        backgroundColor: '#87ceeb', // Sky-blue background (default background)
        
        physics: {
            default: 'arcade', // Arcade physics engine
            arcade: {
                gravity: { y: 500 }, // Global downward gravity
                debug: false         // Set true to see physics bodies
            }
        },

        // === SCENES ===
        // Instead of inline preload/create/update, we now reference external Scene files
        // Example: GameplayScene.js will define preload(), create(), update()
        scene: [GameplayScene],

        scale: {
            mode: Phaser.Scale.RESIZE,        // Resize canvas to fit window
            autoCenter: Phaser.Scale.CENTER_BOTH // Center the game
        }
    };

    // === CREATE GAME INSTANCE ===
    const game = new Phaser.Game(config);
}
