export default class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    preload() {
        // === Load background asset (forest background, etc.) ===
        this.load.image('background', 'assets/background.png');
    }

    create() {
        const { width, height } = this.scale;

        // === Background image (your forest bg) ===
        // Positioned at the bottom center → scaled to fill screen
        this.add.image(width / 2, height, 'background')
            .setOrigin(0.5, 1)
            .setDisplaySize(width, height);

        // === IMPORTANT: Wait until font is ready before adding text/buttons ===
        // Ensures "Press Start 2P" font is loaded from Google Fonts
        document.fonts.ready.then(() => {

            // === Title ===
            this.add.text(width / 2, height * 0.2, "Select Mode", {
                fontFamily: '"Press Start 2P"', // wrapped in quotes for safety
                fontSize: '60px',               // bigger title
                color: '#FFFFFF'
            }).setOrigin(0.5);

            // === Button settings (mode buttons) ===
            const buttonWidth = 260;   // fixed width for all buttons
            const buttonHeight = 200;  // fixed height for all buttons
            const buttonSpacing = 50;  // space between buttons

            // === Available game modes (all go to GameplayScene for now) ===
            // Later, you can replace "GameplayScene" with "DifficultyScene"
            const modes = [
                { text: "SINGLE\nPLAYER", scene: "GameplayScene" },
                { text: "AI CO-OP", scene: "GameplayScene" },
                { text: "PLAYER\nvs AI", scene: "GameplayScene" }
            ];

            // === Helper function to create rounded boxes with text ===
            const createRoundedBox = (x, y, w, h, radius, fillColor, strokeColor, text, fontSize = 20, autoResize = false) => {
                // Graphics object for rounded rect
                const graphics = this.add.graphics();
                graphics.fillStyle(fillColor, 1);
                graphics.lineStyle(3, strokeColor, 1);
                graphics.fillRoundedRect(0, 0, w, h, radius);
                graphics.strokeRoundedRect(0, 0, w, h, radius);

                // Convert to texture (unique key each time)
                const key = 'box-' + text + '-' + Date.now();
                graphics.generateTexture(key, w, h);
                graphics.destroy();

                // Create image from generated texture
                const box = this.add.image(x, y, key).setOrigin(0.5).setInteractive({ useHandCursor: true });

                // Add text (centered on box)
                const label = this.add.text(x, y, text, {
                    fontFamily: '"Press Start 2P"',   // font applied correctly
                    fontSize: `${fontSize}px`,        // dynamic font size
                    color: '#000000',
                    align: 'center'
                }).setOrigin(0.5);

                // === NEW FEATURE: Auto-shrink text if too long ===
                if (autoResize) {
                    const maxWidth = w - 20; // padding inside box
                    while (label.width > maxWidth && fontSize > 8) {
                        fontSize -= 1;
                        label.setFontSize(fontSize);
                    }
                }

                return { box, label };
            };

            // === Place mode buttons (center of screen) ===
            const totalWidth = (modes.length * buttonWidth) + ((modes.length - 1) * buttonSpacing);
            let startX = (width - totalWidth) / 2 + buttonWidth / 2;
            const yPos = height * 0.5;

            modes.forEach((mode, index) => {
                const xPos = startX + index * (buttonWidth + buttonSpacing);

                // Create rounded box for button
                const { box } = createRoundedBox(
                    xPos, yPos,
                    buttonWidth, buttonHeight,
                    20,        // radius for corner roundness
                    0xFFA500,  // orange fill
                    0x000000,  // black border
                    mode.text,
                    28         // font size → increased
                );

                // === Hover effect ===
                box.on('pointerover', () => box.setTint(0xFFCE54));
                box.on('pointerout', () => box.clearTint());

                // === On click → go to selected scene (GameplayScene for now) ===
                box.on('pointerdown', () => {
                    console.log("👉 Mode clicked:", mode.text);
                    this.scene.start(mode.scene, { selectedMode: mode.text });
                });
            });

            // === Top bar buttons (coins, shop, settings, username) ===
            
            // ✅ Get username from Phaser registry (set in index.html after login)
            const playerUsername = this.registry.get("username") || "Guest";

            // Left side → Username box
            createRoundedBox(
                width * 0.1, height * 0.05,
                180, 40,     // width, height (wider for longer names)
                10,          // radius
                0xffffff,    // white fill
                0x000000,    // black border
                playerUsername, // ✅ actual username here
                14,          // starting font size
                true         // ✅ autoResize enabled for long names
            );

            // ✅ Get coin balance from registry
            const playerCoins = this.registry.get("coins") || 0;

            // === Coins box (moved OUTSIDE the loop so it shows only once) ===
            createRoundedBox(
                width * 0.75, height * 0.05,
                130, 40,
                10,
                0xffffff,
                0x000000,
                `${playerCoins}`,  // ✅ display actual balance
                14
            );

            // === Shop & Settings buttons (right side) ===
            const menuButtons = ["SHOP", "SETTINGS"];
            menuButtons.forEach((btn, i) => {
                createRoundedBox(
                    width * 0.75 + (i + 1) * 150, height * 0.05, // ✅ shifted so Coins stays on left
                    130, 40,     // width, height
                    10,          // radius
                    0xffffff,    // white fill
                    0x000000,    // black border
                    btn,
                    14           // font size
                );
            });

        }); // end of document.fonts.ready   
    }
}
