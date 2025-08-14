function initPhaserGame() {

    const config = {
        //Phaser.AUTO for Rendering 
        type: Phaser.AUTO,
        //To automaticlly cover whole screen or WEb page
        width: window.innerWidth,
        height: window.innerHeight,

        backgroundColor: '#87ceeb', // light sky blue

        physics: {
            default: 'arcade',// Uses Arcade Physics, which is a lightweight physics system for 2D platformers, collisions, etc.
            arcade: {
                gravity: { y: 500 },//garvity to pull down character
                debug: false
            }//Adds gravity pulling down with a strength of 300.
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        },//We group physics settings together under "physics" so phaser knows all rules about movement etc
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }//The game resizes if the player changes the browser window size.The game is always centered.
    };

    const game = new Phaser.Game(config);//this create the game phaser.Game() is a constructor it need to config the object to know: 
    //Window Size , Physics Settings
}

function preload() {
    // Load assets here later (key, door, etc.)
}

function create() {
    //This is where you add things to the screen: text, images, sprites, physics objects, etc.

    // Display welcome message with the player's username (set in index.html after login)
    this.add.text(50, 50, `Welcome ${window.playerName}!`, {
        fontSize: '32px',
        fill: '#000'
    });

    // === PLAYER BLOCK ===
    this.player = this.add.rectangle(100, 100, 50, 50, 0xff0000); // Red block
    this.physics.add.existing(this.player); // Enable physics for player
    this.player.body.setCollideWorldBounds(true); // Stop going outside the screen

    // === GROUND BLOCK ===
    const groundY = this.scale.height - 25; // Near bottom
    this.ground = this.add.rectangle(this.scale.width / 2, groundY, this.scale.width, 50, 0x2ecc71); // Green block
    this.physics.add.existing(this.ground);
    this.ground.body.setAllowGravity(false); // Ground shouldn't fall
    this.ground.body.setImmovable(true); // Ground shouldn't move when hit

    // === PLATFORMS GROUP ===
    this.platforms = this.physics.add.staticGroup();

    // Function to create a rectangle platform
    const addPlatform = (x, y, width, height, color) => {
        let platform = this.add.rectangle(x, y, width, height, color);
        this.physics.add.existing(platform, true); // 'true' makes it static
        this.platforms.add(platform);
    };

    // Ground is already there — now add floating platforms
    addPlatform(400, 500, 200, 20, 0x8e44ad); // Purple platform
    addPlatform(700, 400, 200, 20, 0x3498db); // Blue platform
    addPlatform(400, 300, 200, 20, 0xe67e22); // Orange platform

    // Collider between player and all platforms
    this.physics.add.collider(this.player, this.platforms);

    // Collider between player and ground
    this.physics.add.collider(this.player, this.ground);

    // === STEP 5: KEY & DOOR SYSTEM ===

    // Track whether player has collected the key
    this.hasKey = false;

    // Create a key object (placeholder yellow square)
    this.key = this.add.rectangle(400, 250, 30, 30, 0xf1c40f);
    this.physics.add.existing(this.key);
    this.key.body.setAllowGravity(false); // Key shouldn't fall

    // UI key icon in top-left (hidden until collected)
    this.keyIcon = this.add.rectangle(60, 110, 30, 30, 0xf1c40f);
    this.keyIcon.setVisible(false); // Hidden at start
    this.keyIcon.setScrollFactor(0); // Stays in place if camera moves

    // Create a door object (placeholder blue rectangle)
    this.door = this.add.rectangle(900, groundY - 60, 50, 80, 0x2980b9);//60 means how above the door will be form ground 50,80 is hight and width
    this.physics.add.existing(this.door);
    this.door.body.setAllowGravity(false);
    this.door.body.setImmovable(true);

    // When player overlaps with key, collect it
    this.physics.add.overlap(this.player, this.key, () => {
        this.key.destroy(); // Remove key from level
        this.hasKey = true; // Player now has key
        this.keyIcon.setVisible(true); // Show icon in UI
    });

    // When player overlaps with door, check win condition
    this.physics.add.overlap(this.player, this.door, () => {
        if (this.hasKey) {
            this.add.text(this.scale.width / 2 - 100, this.scale.height / 2, 'Level Complete!', {
                fontSize: '48px',
                fill: '#2ecc71'
            }).setScrollFactor(0);
            this.player.body.setVelocity(0, 0);
            this.player.body.moves = false; // Stop movement after winning
        }
    });

    // === CONTROLS ===
    this.cursors = this.input.keyboard.createCursorKeys(); // Arrow keys
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE'); // WASD + Space
}

function update() {
    // Game loop logic will go here
    //update() runs every frame (about 60 times per second).
    //This is where you check player input, move characters, detect AI behavior, etc.

    const speed = 300; // Horizontal speed
    const jumpSpeed = -350; // Jump velocity

    // Stop horizontal movement every frame
    this.player.body.setVelocityX(0);

    // Move Left
    if (this.cursors.left.isDown || this.keys.A.isDown) {
        this.player.body.setVelocityX(-speed);
    }

    // Move Right
    if (this.cursors.right.isDown || this.keys.D.isDown) {
        this.player.body.setVelocityX(speed);
    }

    // Jump (only if grounded)
    const isGrounded = this.player.body.blocked.down;
    if ((this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown) && isGrounded) {
        this.player.body.setVelocityY(jumpSpeed);
    }
}
