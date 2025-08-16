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
    this.box = this.add.rectangle(
        400,
        groundY - 200, // Spawn above ground
        50,
        boxHeight,
        0x964B00 // Brown
    );
    this.physics.add.existing(this.box); // Physics enabled
    this.box.body.setCollideWorldBounds(true); // Stay in bounds
    this.box.body.setBounce(0); // No bounce
    this.box.body.setDragX(700); // Friction effect when sliding
    this.box.body.setMass(2); // Heavier than player

    // === MOVING PLATFORM 1 (HORIZONTAL ORANGE) ===
    this.movingPlatform1 = this.add.rectangle(400, 400, 200, 20, 0xe67e22); // Orange
    this.physics.add.existing(this.movingPlatform1); // Dynamic body
    this.movingPlatform1.body.setImmovable(true);
    this.movingPlatform1.body.setAllowGravity(false);
    this.movingPlatform1.body.setVelocityX(100); // Move initially to right

    // === VERTICAL MOVING PLATFORM ===
    this.verticalPlatform = this.add.rectangle(800, 300, 200, 20, 0x27ae60); // Green platform
    this.physics.add.existing(this.verticalPlatform); // Dynamic body
    this.verticalPlatform.body.setImmovable(true);
    this.verticalPlatform.body.setAllowGravity(false);
    this.verticalPlatform.body.setVelocityY(75); // Move initially down

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

    // === TIMER ===
    this.startTime = this.time.now; // Save starting time
    this.elapsedText = this.add.text(this.scale.width / 2, 30, '0.0s', {
        fontSize: '28px',
        fill: '#000'
    }).setOrigin(0.5, 0); // Center align
    this.elapsedText.setScrollFactor(0); // Stay fixed on screen
    this.timerRunning = true; // Timer active

    // === STAR SCORING SYSTEM ===
    this.starsText = this.add.text(this.scale.width / 2, 70, '', {
        fontSize: '28px',
        fill: '#FFD700' // Gold color
    }).setOrigin(0.5, 0);
    this.starsText.setScrollFactor(0); // Stay fixed on screen

    // === COLLIDERS ===
    this.physics.add.collider(this.player, this.groundLeft);  
    this.physics.add.collider(this.player, this.groundRight);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatform1);
    this.physics.add.collider(this.box, this.groundLeft);
    this.physics.add.collider(this.box, this.groundRight);
    this.physics.add.collider(this.box, this.platforms);
    this.physics.add.collider(this.box, this.movingPlatform1);
    this.physics.add.collider(this.player, this.box);
    this.physics.add.collider(this.player, this.verticalPlatform);
    this.physics.add.collider(this.box, this.verticalPlatform);
    this.physics.add.collider(this.player, this.bridge);
    this.physics.add.collider(this.box, this.bridge);

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
    addPlatform(200, 510, 200, 20, 0x8e44ad); // Purple platform
    addPlatform(200, 300, 200, 20, 0x3498db); // Blue platform

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

    // === OPEN DOOR (LEVEL COMPLETE) ===
    this.physics.add.overlap(this.player, this.door, () => {
        if (this.hasKey) {
            // Stop player movement when door reached
            this.player.body.setVelocity(0, 0); 
            this.player.body.moves = false;     
            this.timerRunning = false; // Stop the timer

            // === CALCULATE ELAPSED TIME ===
            let elapsed = (this.time.now - this.startTime) / 1000; // in seconds

            // === STAR RATING SYSTEM ===
            let starsEarned = 1; // default
            if (elapsed < 90) {           // under 1 min 30 sec
                starsEarned = 3;
            } else if (elapsed < 150) {   // under 2 min 30 sec
                starsEarned = 2;
            }

            // === COINS BASED ON STARS ===
            let coinsEarned = 0;
            if (starsEarned === 3) {
                coinsEarned = 150;
            } else if (starsEarned === 2) {
                coinsEarned = 75;
            } else {
                coinsEarned = 50;
            }

            // === DISPLAY SCOREBOARD ===
            // Semi-transparent background box
            let scoreboardBg = this.add.rectangle(
                this.scale.width / 2, 
                this.scale.height / 2, 
                400, 
                250, 
                0x000000, 
                0.7
            ).setOrigin(0.5);

            // Title
            this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'Level Complete!', {
                fontSize: '40px',
                fill: '#2ecc71'
            }).setOrigin(0.5);

            // Show elapsed time
            this.add.text(this.scale.width / 2, this.scale.height / 2 - 30, `Time: ${elapsed.toFixed(1)}s`, {
                fontSize: '28px',
                fill: '#fff'
            }).setOrigin(0.5);

            // === SHOW STARS EARNED ===
            // Repeat the star symbol based on how many stars player earned
            let starDisplay = '⭐'.repeat(starsEarned);

            this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, `Stars: ${starDisplay}`, {
                fontSize: '28px',
                fill: '#f1c40f'
            }).setOrigin(0.5);


            // Show coins earned
            this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, `Coins: ${coinsEarned}`, {
                fontSize: '28px',
                fill: '#f39c12'
            }).setOrigin(0.5);
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

    // Jump if on floor/platform
    if ((this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown) && this.player.body.blocked.down) {
        this.player.body.setVelocityY(jumpSpeed);
    }

    // === MOVING PLATFORM LOGIC ===
    // Reverse direction at edges
    if (this.movingPlatform1.x >= 550) {
        this.movingPlatform1.body.setVelocityX(-75);
    } else if (this.movingPlatform1.x <= 400) {
        this.movingPlatform1.body.setVelocityX(75);
    }

    // === VERTICAL PLATFORM LOGIC ===
    if (this.verticalPlatform.y >= 400) {     // bottom limit
        this.verticalPlatform.body.setVelocityY(-75); // move up
    } else if (this.verticalPlatform.y <= 250) { // top limit
        this.verticalPlatform.body.setVelocityY(75);  // move down
    }

    // === TIMER UPDATE ===
    if (this.timerRunning) {
        let elapsed = (this.time.now - this.startTime) / 1000; // seconds
        this.elapsedText.setText('' + elapsed.toFixed(1) + ''); // Update text
    }

    // === SWITCH LOGIC ===
    // Check if player or box is on the switch
    const switchTop = this.switch.y - this.switch.height / 2;
    const switchBottom = this.switch.y + this.switch.height / 2;
    const switchLeft = this.switch.x - this.switch.width / 2;
    const switchRight = this.switch.x + this.switch.width / 2;

    // Conditions for player standing on switch
    const isPlayerOnSwitch = this.player.x > switchLeft && this.player.x < switchRight &&
                             this.player.y + this.player.height / 2 >= switchTop &&
                             this.player.y + this.player.height / 2 <= switchBottom + 5;

    // Conditions for box on switch
    const isBoxOnSwitch = this.box.x > switchLeft && this.box.x < switchRight &&
                          this.box.y + this.box.height / 2 >= switchTop &&
                          this.box.y + this.box.height / 2 <= switchBottom + 5;

    // Toggle bridge depending on switch state
    if (isPlayerOnSwitch || isBoxOnSwitch) {
        this.switch.fillColor = 0x2ecc71; // Green when ON
        this.bridge.visible = true;
        this.bridge.body.enable = true; // Activate bridge
    } else {
        this.switch.fillColor = 0x7f8c8d; // Gray when OFF
        this.bridge.visible = false;
        this.bridge.body.enable = false; // Disable bridge
    }
}

// === START THE GAME ===
initPhaserGame();
