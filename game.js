// game.js
import GameplayScene from "./scenes/GameplayScene.js";
import AICoopScene from "./scenes/AICoopScene.js";
import AIRaceScene from "./scenes/AIRaceScene.js";

export function initPhaserGame(username, coins = 0, startMode = 'single_player') {
    
    // 1. Destroy existing game instance if it exists (Ensures a clean start)
    if (window._escapeGameInstance) {
        window._escapeGameInstance.destroy(true);
        window._escapeGameInstance = null;
    }

    // 2. Determine which scene should come first based on the mode
    let sceneOrder = [GameplayScene, AICoopScene, AIRaceScene]; // Default

    if (startMode === 'ai_coop') {
        sceneOrder = [AICoopScene, GameplayScene, AIRaceScene];
    } else if (startMode === 'ai_race') {
        sceneOrder = [AIRaceScene, GameplayScene, AICoopScene];
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
        // The first scene in this list starts automatically
        scene: sceneOrder,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
    };

    const game = new Phaser.Game(config);
    game.registry.set("username", username || "Guest");
    game.registry.set("coins", coins);
    
    window._escapeGameInstance = game;
    return game;
}


// === MAKE initPhaserGame AVAILABLE GLOBALLY ===
// This MUST come after the function definition.
// It should NOT overwrite the real function.
window.initPhaserGame = initPhaserGame;