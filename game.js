function initPhaserGame() {
    // === GAME CONFIGURATION ===
    const config = {
        type: Phaser.AUTO, // Automatically choose WebGL or Canvas
        width: window.innerWidth, // Full browser width
        height: window.innerHeight, // Full browser height
        backgroundColor: '#87ceeb', // Sky-blue background
        physics: {
            default: 'arcade', // Arcade physics engine
            arcade: {
                gravity: { y: 500 }, // Global downward gravity
                debug: false         // Set true to see physics bodies
            }
        },
        scene: {
            preload: preload, // Load assets
            create: create,   // Set up game objects
            update: update    // Game loop
        },
        scale: {
            mode: Phaser.Scale.RESIZE,        // Resize canvas to fit window
            autoCenter: Phaser.Scale.CENTER_BOTH // Center the game
        }
    };

    // Create the Phaser game instance
    const game = new Phaser.Game(config);
}

// === LOAD ASSETS ===
function preload() {
    // Example: load images, spritesheets, audio
    // this.load.image('player', 'assets/player.png');
    // For now, we are using colored rectangles
}

// === CREATE GAME OBJECTS ===
function create() {
    // === WELCOME MESSAGE ===
    this.add.text(50, 50, `Welcome ${window.playerName}!`, {
        fontSize: '32px',
        fill: '#000' // Black text
    });

    // === GROUND WITH GAP ===
    const groundHeight = 50; // Ground thickness
    const groundY = this.scale.height - groundHeight / 2; // Ground center Y

    // --- GAP CONFIGURATION ---
    const gapStartX = 650; // X where gap begins
    const gapWidth = 300;  // Width of gap

    // Left ground: from left edge to gap
    const leftGroundWidth = gapStartX;
    this.groundLeft = this.add.rectangle(leftGroundWidth / 2, groundY, leftGroundWidth, groundHeight, 0x2ecc71); // Green
    this.physics.add.existing(this.groundLeft, true); // Static body

    // Right ground: from gap end to right edge
    const rightGroundWidth = this.scale.width - (gapStartX + gapWidth);
    this.groundRight = this.add.rectangle(
        gapStartX + gapWidth + rightGroundWidth / 2,
        groundY,
        rightGroundWidth,
        groundHeight,
        0x2ecc71 // Green
    );
    this.physics.add.existing(this.groundRight, true); // Static body

    // === PLAYER ===
    this.player = this.add.rectangle(100, 100, 50, 50, 0xff0000); // Red square
    this.physics.add.existing(this.player); // Enable physics
    this.player.body.setCollideWorldBounds(true); // Stay inside game world
    this.player.body.setBounce(0);                // No bouncing
    this.player.body.setGravityY(500);           // Player affected by gravity
    this.player.body.setVelocity(0, 0);          // Start still
    this.player.body.setAllowGravity(true);      // Gravity active
    this.player.body.setImmovable(false);        // Can move if pushed

    // === PLATFORMS GROUP ===
    this.platforms = this.physics.add.staticGroup(); // Static platforms group

    // Helper function to create a static platform
    const addPlatform = (x, y, width, height, color) => {
        let platform = this.add.rectangle(x, y, width, height, color);
        this.physics.add.existing(platform, true); // true = static body
        this.platforms.add(platform);
    };

    // === PUSHABLE BOX ===
    const boxHeight = 50; // Box size
    // Position box on top of ground
    this.box = this.add.rectangle(
        400,
        groundY - 200, // Align center of box with ground
        50,
        boxHeight,
        0x964B00 // Brown
    );
    this.physics.add.existing(this.box); // Physics enabled
    this.box.body.setCollideWorldBounds(true); // Stay in bounds
    this.box.body.setBounce(0); // No bounce
    this.box.body.setDragX(700); // Friction
    this.box.body.setMass(2); // Heavier than player

    // === BRIDGE over gap (initially hidden) ===
    this.bridge = this.add.rectangle(
        gapStartX + gapWidth / 2, // center of gap
        groundY,                  // same height as ground
        gapWidth,                 // width of gap
        groundHeight,             // same height as ground
        0x95a5a6                  // gray bridge
    );
    this.physics.add.existing(this.bridge, true); // static
    this.bridge.visible = false; // hide initially
    this.bridge.body.enable = false; // disable collisions initially

    // === COLLIDERS ===
    this.physics.add.collider(this.player, this.groundLeft);  // Player stands on left ground
    this.physics.add.collider(this.player, this.groundRight); // Player stands on right ground
    this.physics.add.collider(this.player, this.platforms);   // Player on floating platforms
    this.physics.add.collider(this.box, this.groundLeft);     // Box rests on left ground
    this.physics.add.collider(this.box, this.groundRight);    // Box rests on right ground
    this.physics.add.collider(this.box, this.platforms);      // Box on floating platforms
    this.physics.add.collider(this.player, this.box);         // Player can push box
    // Bridge collider
    this.physics.add.collider(this.player, this.bridge); // Player can walk on bridge
    this.physics.add.collider(this.box, this.bridge);    // Box can sit on bridge


    // === FALL DETECTOR ===
    this.fallDetector = this.add.rectangle(
        gapStartX + gapWidth / 2, // Center of gap
        groundY + 25,             // Slightly below ground
        gapWidth,                 // Width of gap
        10                        // Thin rectangle
    );
    this.physics.add.existing(this.fallDetector, true); // Static
    this.fallDetector.visible = false; // Hide detector

    // Restart scene if player or box falls in gap
    this.physics.add.overlap(this.player, this.fallDetector, () => { this.scene.restart(); });
    this.physics.add.overlap(this.box, this.fallDetector, () => { this.scene.restart(); });

    // === FLOATING PLATFORMS ===
    addPlatform(200, 500, 200, 20, 0x8e44ad); // Purple platform
    addPlatform(200, 300, 200, 20, 0x3498db); // Blue platform
    addPlatform(400, 400, 200, 20, 0xe67e22); // Orange platform

    // === KEY & DOOR SYSTEM ===
    this.hasKey = false; // Player starts without key

    // Key in world
    this.key = this.add.rectangle(200, 250, 30, 30, 0xf1c40f); // Yellow
    this.physics.add.existing(this.key);
    this.key.body.setAllowGravity(false); // Key doesn't fall

    // Key icon in UI
    this.keyIcon = this.add.rectangle(60, 110, 30, 30, 0xf1c40f);
    this.keyIcon.setVisible(false); // Hidden until picked
    this.keyIcon.setScrollFactor(0); // Fixed on screen

    // === SWITCH ===
    this.switch = this.add.rectangle(600, groundY - 25, 60, 20, 0x7f8c8d); // Gray switch
    this.physics.add.existing(this.switch, true); // Static body
    this.switch.isActive = false; // Initially OFF

    // Door object
    this.door = this.add.rectangle(1000, groundY - 65, 50, 80, 0x2980b9); // Blue
    this.physics.add.existing(this.door);
    this.door.body.setAllowGravity(false); // Door doesn't fall
    this.door.body.setImmovable(true);     // Door can't be pushed

    // Pick up key
    this.physics.add.overlap(this.player, this.key, () => {
        this.key.destroy();         // Remove key from world
        this.hasKey = true;         // Player now has key
        this.keyIcon.setVisible(true); // Show key icon
    });

    // Open door
    this.physics.add.overlap(this.player, this.door, () => {
        if (this.hasKey) {
            this.add.text(this.scale.width / 2 - 100, this.scale.height / 2, 'Level Complete!', {
                fontSize: '48px',
                fill: '#2ecc71'
            }).setScrollFactor(0); // Show success text
            this.player.body.setVelocity(0, 0); // Stop movement
            this.player.body.moves = false;     // Freeze player
        }
    });

    // === PLAYER CONTROLS ===
    this.cursors = this.input.keyboard.createCursorKeys();        // Arrow keys
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');     // WASD + SPACE
}

    // === GAME LOOP ===
    function update() {
    const speed = 250;      // Horizontal movement speed
    const jumpSpeed = -475; // Jump velocity (negative = up)

    // Reset horizontal velocity each frame
    this.player.body.setVelocityX(0);

    // Move left
    if (this.cursors.left.isDown || this.keys.A.isDown) {
        this.player.body.setVelocityX(-speed);
    }

    // Move right
    if (this.cursors.right.isDown || this.keys.D.isDown) {
        this.player.body.setVelocityX(speed);
    }

    // Jump only if player is on the ground
    const isGrounded = this.player.body.blocked.down;
    if ((this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown) && isGrounded) {
        this.player.body.setVelocityY(jumpSpeed);
    }

    // === SWITCH LOGIC ===
    const isPlayerOnSwitch = Phaser.Geom.Intersects.RectangleToRectangle(
        this.player.getBounds(),
        this.switch.getBounds()
    );

    const isBoxOnSwitch = Phaser.Geom.Intersects.RectangleToRectangle(
        this.box.getBounds(),
        this.switch.getBounds()
    );

    // Activate switch if player or box is standing on it
    if ((isPlayerOnSwitch || isBoxOnSwitch) && !this.switch.isActive) {
        this.switch.isActive = true;        // Switch is now ON
        this.switch.fillColor = 0x27ae60;   // Change switch color to green

        // Reveal bridge over the gap
        this.bridge.visible = true;         // Show bridge
        this.bridge.body.enable = true;     // Enable collision
    }

    // Optional: reset switch if neither player nor box is on it
    if (!isPlayerOnSwitch && !isBoxOnSwitch && this.switch.isActive) {
        this.switch.isActive = false;       // Switch is now OFF
        this.switch.fillColor = 0x7f8c8d;  // Gray again
        this.bridge.visible = false;        // Hide bridge
        this.bridge.body.enable = false;    // Disable collision
    }

}
