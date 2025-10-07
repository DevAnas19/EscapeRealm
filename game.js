// === MAIN GAME INITIALIZATION ===
// This file creates the Phaser game instance and references GameplayScene.js.

// ✅ Import your only active scene
import GameplayScene from "./scenes/GameplayScene.js";

// === TEMPORARY MENU / HOME SCENE ===
// A lightweight scene that exists so Phaser can start properly.
class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const username = this.registry.get("username") || "Guest";
    const coins = this.registry.get("coins") || 0;

    console.log(`✅ MenuScene active for ${username} with ${coins} coins`);

    // Optional: show a minimal message or background color
    this.cameras.main.setBackgroundColor("#202030");

    const text = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "EscapeRealm Ready!",
      {
        fontFamily: "Press Start 2P",
        fontSize: "16px",
        fill: "#ffffff",
        align: "center",
      }
    ).setOrigin(0.5);

    // Listen for resize
    this.scale.on("resize", () => {
      text.setPosition(this.scale.width / 2, this.scale.height / 2);
    });
  }
}

// === MAIN INITIALIZATION FUNCTION ===
function initPhaserGame(username, coins = 0) {
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

    scene: [GameplayScene], // ✅ Only these two
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  const game = new Phaser.Game(config);

  // Store player data globally
  game.registry.set("username", username || "Guest");
  game.registry.set("coins", coins);

  return game;
}

// ✅ Expose globally so index.html can call it
window.initPhaserGame = initPhaserGame;
