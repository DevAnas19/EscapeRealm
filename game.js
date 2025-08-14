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
    // Load assets here later
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
