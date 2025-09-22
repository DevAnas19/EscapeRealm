// === MAIN GAME INITIALIZATION ===
// This file is responsible for creating the Phaser game instance.
// It references external scene files like GameplayScene.js

// ✅ Import external scenes
import HomeScene from "./scenes/HomeScene.js";
import GameplayScene from "./scenes/GameplayScene.js";

// ✅ Accept username and coins as parameters from index.html
function initPhaserGame(username, coins = 0) {
  // === GAME CONFIGURATION ===
  const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas (best option for browser)
    transparent: true,
    width: window.innerWidth, // Full browser width
    height: window.innerHeight, // Full browser height
    parent: "game-container",

    physics: {
      default: "arcade", // Arcade physics engine
      arcade: {
        gravity: { y: 500 }, // Global downward gravity
        debug: false, // Set true to see physics bodies
      },
    },

    // === SCENES ===
    // Instead of inline preload/create/update, we now reference external Scene files
    // Example: GameplayScene.js will define preload(), create(), update()
    scene: [HomeScene, GameplayScene],

    scale: {
      mode: Phaser.Scale.RESIZE, // Resize canvas to fit window
      autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game
    },
  };

  // === CREATE GAME INSTANCE ===
  const game = new Phaser.Game(config);

  // ✅ Save username into registry immediately (so HomeScene can use it right away)
  game.registry.set("username", username || "Guest");

  // ✅ Save coins into registry (so HomeScene and GameplayScene can access/update it)
  game.registry.set("coins", coins);

  // 🔑 Now both username and coins are accessible in any scene like:
  // this.registry.get("username")
  // this.registry.get("coins")

  return game; // ✅ return so index.html can keep a reference
}

// ✅ Expose globally so index.html can call it with username + coins
window.initPhaserGame = initPhaserGame;
