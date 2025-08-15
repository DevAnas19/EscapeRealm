function initPhaserGame() {

    const config = {
        // Phaser.AUTO chooses WebGL or Canvas automatically for rendering
        type: Phaser.AUTO,

        // Automatically fill the whole window
        width: window.innerWidth,
        height: window.innerHeight,

        backgroundColor: '#87ceeb', // light sky blue

        physics: {
            default: 'arcade', // Lightweight physics for collisions & gravity
            arcade: {
                gravity: { y: 500 }, // Downward gravity strength
                debug: false // Set to true if you want to see hitboxes
            }
        },

        scene: {
            preload: preload,
            create: create,
            update: update
        },

        scale: {
            mode: Phaser.Scale.RESIZE, // Game resizes when window size changes
            autoCenter: Phaser.Scale.CENTER_BOTH // Always center game in screen
        }
    };

    // Create Phaser game instance
    const game = new Phaser.Game(config);
}

function preload() {
    // Load assets later (key, door images, player sprites, etc.)
}

function create() {
    // === WELCOME MESSAGE ===
    this.add.text(50, 50, `Welcome ${window.playerName}!`, {
        fontSize: '32px',
        fill: '#000'
    });

    // === PLAYER ===
    this.player = this.add.rectangle(100, 100, 50, 50, 0xff0000); // Red block
    this.physics.add.existing(this.player); // Enable physics
    this.player.body.setCollideWorldBounds(true); // Prevent leaving screen
    this.player.body.setBounce(0); // No bounce
    this.player.body.setGravityY(500); // Add gravity
    this.player.body.setVelocity(0, 0); 
    this.player.body.setAllowGravity(true);
    this.player.body.setImmovable(false); // Ensure player can fall

    // === PLATFORMS GROUP (for floating platforms only) ===
    this.platforms = this.physics.add.staticGroup();

    // Helper function to quickly create a static rectangle platform
    const addPlatform = (x, y, width, height, color) => {
        let platform = this.add.rectangle(x, y, width, height, color);
        this.physics.add.existing(platform, true); // 'true' = static body
        this.platforms.add(platform);
    };

   // === GROUND BLOCK WITH GAP ===
    const groundHeight = 50;
    const groundY = this.scale.height - groundHeight / 2;

    // --- GAP CONFIGURATION ---
    // Change gapStartX to move the hole horizontally
    const gapStartX = 650; // x position where gap , starts more value of X it will shift to right 
    const gapWidth = 300;  // width of the gap

    // Left ground: from left edge to start of gap
    const leftGroundWidth = gapStartX;
    this.groundLeft = this.add.rectangle(leftGroundWidth / 2, groundY, leftGroundWidth, groundHeight, 0x2ecc71);
    this.physics.add.existing(this.groundLeft, true);

    // Right ground: from end of gap to right edge
    const rightGroundWidth = this.scale.width - (gapStartX + gapWidth);
    this.groundRight = this.add.rectangle(
        gapStartX + gapWidth + rightGroundWidth / 2, // center x
        groundY,
        rightGroundWidth,
        groundHeight,
        0x2ecc71
    );
    this.physics.add.existing(this.groundRight, true);

    // Colliders for player
    this.physics.add.collider(this.player, this.groundLeft);
    this.physics.add.collider(this.player, this.groundRight);

    // === FALL DETECTOR ===
    // Invisible rectangle in the gap that triggers level restart
    this.fallDetector = this.add.rectangle(
        gapStartX + gapWidth / 2, // center x of gap
        groundY + 25,             // slightly below ground
        gapWidth,                  // width matches gap
        10
    );
    this.physics.add.existing(this.fallDetector, true);
    this.fallDetector.visible = false; // hide it

    // Restart level if player touches fallDetector
    this.physics.add.overlap(this.player, this.fallDetector, () => {
        this.scene.restart();
    });


    // === FLOATING PLATFORMS ===
    addPlatform(200, 500, 200, 20, 0x8e44ad); // Purple
    addPlatform(200, 300, 200, 20, 0x3498db); // Blue
    addPlatform(400, 400, 200, 20, 0xe67e22); // Orange
    this.physics.add.collider(this.player, this.platforms);

    // === STEP 5: KEY & DOOR SYSTEM ===
    this.hasKey = false;

    this.key = this.add.rectangle(200, 250, 30, 30, 0xf1c40f);
    this.physics.add.existing(this.key);
    this.key.body.setAllowGravity(false);

    this.keyIcon = this.add.rectangle(60, 110, 30, 30, 0xf1c40f);
    this.keyIcon.setVisible(false);
    this.keyIcon.setScrollFactor(0);

    this.door = this.add.rectangle(1000, groundY - 40, 50, 80, 0x2980b9);
    this.physics.add.existing(this.door);
    this.door.body.setAllowGravity(false);
    this.door.body.setImmovable(true);

    // === COLLISIONS & OVERLAPS ===
    this.physics.add.overlap(this.player, this.key, () => {
        this.key.destroy();
        this.hasKey = true;
        this.keyIcon.setVisible(true);
    });

    this.physics.add.overlap(this.player, this.door, () => {
        if (this.hasKey) {
            this.add.text(this.scale.width / 2 - 100, this.scale.height / 2, 'Level Complete!', {
                fontSize: '48px',
                fill: '#2ecc71'
            }).setScrollFactor(0);
            this.player.body.setVelocity(0, 0);
            this.player.body.moves = false;
        }
    });

    // === CONTROLS ===
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
}


// === UPDATE FUNCTION ===
function update() {
    const speed = 300;      // Horizontal speed
    const jumpSpeed = -475; // Jump velocity (negative = upward)

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

    // === FALL DETECTION ===
    // Restart level if player falls below the bottom of the screen
    if (this.player.y > this.scale.height + 50) {
        this.scene.restart();
    }
}


