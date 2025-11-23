// game.js
import GameplayScene from "./scenes/GameplayScene.js";
import AICoopScene from "./scenes/AICoopScene.js";

// === MAIN INITIALIZATION FUNCTION ===
export function initPhaserGame(username, coins = 0) {

  // If game already exists, return it immediately
  if (window._escapeGameInstance) {
    return window._escapeGameInstance;
  }

  const config = {
    type: Phaser.AUTO,
    transparent: true,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",

    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 500 },
        debug: false,
      },
    },

    scene: [AICoopScene, GameplayScene],

    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  // Create the Phaser game
  const game = new Phaser.Game(config);

  // Store player data globally
  game.registry.set("username", username || "Guest");
  game.registry.set("coins", coins);

  // Save globally so index.html can access it
  window._escapeGameInstance = game;

  return game;
}

// === MAKE initPhaserGame AVAILABLE GLOBALLY ===
// This MUST come after the function definition.
// It should NOT overwrite the real function.
window.initPhaserGame = initPhaserGame;
