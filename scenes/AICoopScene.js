import AICoopController from './AI/AICoopController.js';

export default class AICoopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AICoopScene' });

        // Physics bodies (hitboxes)
        this.player = null;
        this.aiPartner = null;

        // Visual sprites (overlays)
        this.playerSprite = null;
        this.aiSprite = null;

        // Objects
        this.platforms = null;
        this.bridgePieces = [];
        this.box = null;
        this.keyObj = null;
        this.keySprite = null;
        this.door = null;
        this.doorSprite = null;
        this.switchObj = [];
        this.fallDetectors = [];

        // Level / state
        this.levelData = null;
        this.level = 1;
        this.hasKey = false;
        this._doorOpening = false;

        // Timer / UI
        this.startTime = 0;
        this.elapsedText = null;
        this.timerRunning = false;

        // Input
        this.cursors = null;
        this.keys = null;

        // AI
        this.aiBrain = null;
    }

    init(data) {
        this.level = data.level || 1;
    }

    preload() {
        // Load background if not already loaded
        if (!this.textures.exists("background")) {
            this.load.image("background", "assets/background.png");
        }

        // Character images (animated frames are single images here)
        const images = ["RS", "LS", "RW", "LW", "RJ", "LJ"];
        images.forEach(key => {
            if (!this.textures.exists(key)) {
                this.load.image(key, `assets/sprites/${key}.png`);
            }
        });

        // Items and animations
        if (!this.textures.exists("key_anim")) {
            this.load.spritesheet("key_anim", "assets/items/KeyFly.png", { frameWidth: 64, frameHeight: 64 });
        }
        if (!this.textures.exists("door_anim")) {
            this.load.spritesheet("door_anim", "assets/items/Door.png", { frameWidth: 64, frameHeight: 64 });
        }

        // Tiles / objects
        if (!this.textures.exists("ground")) {
            this.load.image("ground", "assets/tiles/ground.png");
        }
        if (!this.textures.exists("box")) {
            this.load.image("box", "assets/tiles/box.png");
        }
        if (!this.textures.exists("moving")) {
            this.load.image("moving", "assets/tiles/moving.png");
        }
        if (!this.textures.exists("bridge")) {
            this.load.image("bridge", "assets/tiles/bridge.png");
        }
        if (!this.textures.exists("switch")) {
            this.load.spritesheet("switch", "assets/tiles/switch.png", { frameWidth: 60, frameHeight: 20 });
        }
    }

    create() {
        // Reset state
        this.hasKey = false;
        this._doorOpening = false;
        this.timerRunning = false;

        const levelPath = `scenes/Levels/AICoop/level${this.level}.json`;

        fetch(levelPath)
            .then(res => {
                if (!res.ok) throw new Error("Level not found: " + levelPath);
                return res.json();
            })
            .then(levelData => {
                this.levelData = levelData;
                this._setupLevel();
            })
            .catch(err => {
                console.error(err);
                this.add.text(
                    50,
                    50,
                    `ERROR: Could not load level.
Looking for: ${levelPath}
Check your folder names!`,
                    {
                        fontSize: "20px",
                        fill: "#ff0000",
                        backgroundColor: "#000000"
                    }
                ).setScrollFactor(0);
            });
    }

    // =====================================================
    // LEVEL SETUP
    // =====================================================
    _setupLevel() {
        const L = this.levelData || {};
        const levelWidth = L.levelWidth || 3000;
        const levelHeight = this.scale.height;

        this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
        this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);

        // Background
        if (this.textures.exists("background")) {
            const bg = this.add.image(levelWidth / 2, levelHeight / 2, "background");
            bg.setDisplaySize(levelWidth, levelHeight);
            bg.setDepth(-10);
        }

        // -----------------------------
        // PLAYER (physics hitbox) + sprite overlay
        // -----------------------------
        const spawn = L.playerSpawn || { x: 100, y: 100 };

        // physics hitbox (rectangle) - stable behavior like first file
        this.player = this.add.rectangle(spawn.x, spawn.y, 50, 50, 0xff0000);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(500);
        this.player.setVisible(false); // hide physics rectangle in normal play (debugging: set true)

        // sprite overlay
        this.playerSprite = this.add.sprite(spawn.x, spawn.y, "RS").setOrigin(0.5);
        this.playerSprite.setDisplaySize(50, 50);
        this.playerSprite.facing = "right";

        // -----------------------------
        // AI PARTNER (hitbox + sprite)
        // -----------------------------
        this.aiPartner = this.add.rectangle(spawn.x + 60, spawn.y, 50, 50, 0x00ff00);
        this.physics.add.existing(this.aiPartner);
        this.aiPartner.body.setCollideWorldBounds(true);
        this.aiPartner.body.setGravityY(500);
        this.aiPartner.setVisible(false);

        this.aiSprite = this.add.sprite(spawn.x + 60, spawn.y, "RS").setOrigin(0.5);
        this.aiSprite.setDisplaySize(50, 50);
        this.aiSprite.setTint(0x55ff55);
        this.aiSprite.facing = "right";

        // -----------------------------
        // PLATFORMS (static group) + tiling visuals
        // -----------------------------
       this.platforms = this.physics.add.staticGroup();
(L.platforms || []).forEach(p => {
    const r = this.add.rectangle(p.x, p.y, p.width, p.height, 0x000000, 0); // invisible physics hitbox
    this.physics.add.existing(r, true);
    this.platforms.add(r);


            // Tiling visuals if ground texture exists
            if (this.textures.exists("ground")) {
                const tileW = 32;
                const tilesCount = Math.ceil(p.width / tileW);
                const tileY = p.y - p.height / 2 + tileW / 2;
                const leftStart = p.x - p.width / 2 + tileW / 2;
                for (let i = 0; i < tilesCount; i++) {
                    this.add.image(leftStart + i * tileW, tileY, "ground").setOrigin(0.5);
                }
            }
        });

        // -----------------------------
        // BOX (physics sprite if available, else rectangle)
        // -----------------------------
        if (L.box) {
            if (this.textures.exists("box")) {
                this.box = this.add.sprite(L.box.x, L.box.y, "box");
                this.physics.add.existing(this.box);
                this.box.body.setCollideWorldBounds(true);
                this.box.body.setMass(0.7);
                this.box.body.setDragX(550);
                this.box.body.setBounce(0);
                this.box.body.setSize(50, 50, true);
            } else {
                // fallback to rectangle hitbox
                this.box = this.add.rectangle(L.box.x, L.box.y, L.box.width || 50, L.box.height || 50, 0x964b00);
                this.physics.add.existing(this.box);
                const bbody = this.box.body;
                bbody.setCollideWorldBounds(true);
                bbody.setMass(0.7);
                bbody.setDragX(550);
                bbody.setBounce(0);
            }
        }

        // -----------------------------
        // KEY (invisible physics + sprite animation)
        // -----------------------------
        if (L.key) {
            this.keyObj = this.add.rectangle(L.key.x, L.key.y, L.key.width || 30, L.key.height || 30, 0xf1c40f);
            this.physics.add.existing(this.keyObj);
            this.keyObj.body.setAllowGravity(false);
            this.keyObj.setVisible(false); // physics body hidden, sprite shows visual

            if (this.textures.exists("key_anim")) {
                this.keySprite = this.add.sprite(L.key.x, L.key.y, "key_anim");
                this.keySprite.setScale(1.3);
                if (!this.anims.exists("key_spin")) {
                    this.anims.create({
                        key: "key_spin",
                        frames: this.anims.generateFrameNumbers("key_anim", { start: 0, end: 3 }),
                        frameRate: 8,
                        repeat: -1
                    });
                }
                this.keySprite.play("key_spin");
            } else {
                // fallback visible rectangle for the player to see
                this.keyObj.setVisible(true);
            }
        }

        // -----------------------------
        // DOOR (static body + animated sprite)
        // -----------------------------
        if (L.door) {
            this.door = this.add.rectangle(L.door.x, L.door.y, L.door.width || 50, L.door.height || 80, 0x2980b9);
            this.physics.add.existing(this.door, true);
            this.door.setVisible(false);

            if (this.textures.exists("door_anim")) {
                this.doorSprite = this.add.sprite(L.door.x, L.door.y, "door_anim");
                this.doorSprite.setDisplaySize(L.door.width ? L.door.width * 2 : 100, L.door.height ? L.door.height * 1.5 : 120);
                if (!this.anims.exists("door_idle")) {
                    this.anims.create({
                        key: "door_idle",
                        frames: this.anims.generateFrameNumbers("door_anim", { start: 0, end: 8 }),
                        frameRate: 8,
                        repeat: -1
                    });
                }
                if (!this.anims.exists("door_open")) {
                    this.anims.create({
                        key: "door_open",
                        frames: this.anims.generateFrameNumbers("door_anim", { start: 9, end: 13 }),
                        frameRate: 20,
                        repeat: 0
                    });
                }
                this.doorSprite.play("door_idle");
            } else {
                // fallback visible rectangle
                this.door.setVisible(true);
            }
        }

        // -----------------------------
        // SWITCHES & BRIDGES
        // -----------------------------
        this.bridgePieces = [];
        (L.bridge || []).forEach(b => {
            // prefer tileSprite for visuals if bridge texture exists
            let r;
            if (this.textures.exists("bridge")) {
                r = this.add.tileSprite(b.x, b.y, b.width, b.height, "bridge");
                this.physics.add.existing(r, true);
            } else {
                r = this.add.rectangle(b.x, b.y, b.width, b.height, 0x95a5a6);
                this.physics.add.existing(r, true);
            }

            if (r.body) {
                r.body.enable = b.initiallyEnabled ?? false;
            }
            r.setVisible(b.initiallyEnabled ?? false);
            this.bridgePieces.push(r);
        });

        this.switchObj = [];
        (L.switch || []).forEach(sw => {
            // switch physics object (static)
            const s = this.add.rectangle(sw.x, sw.y, sw.width, sw.height, 0x7f8c8d);
            this.physics.add.existing(s, true);
            this.switchObj.push(s);

            // if spritesheet exists we could animate the switch later (not required now)
        });

        // -----------------------------
        // COLLISIONS
        // -----------------------------
        // Player/AI <-> platforms
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.aiPartner, this.platforms);
        this.physics.add.collider(this.player, this.aiPartner);

        // Player/AI/Box <-> bridge pieces
        this.bridgePieces.forEach(bp => {
            if (bp && bp.body) {
                this.physics.add.collider(this.player, bp);
                this.physics.add.collider(this.aiPartner, bp);
                if (this.box) this.physics.add.collider(this.box, bp);
            }
        });

        // Box collisions with platforms and characters
        if (this.box) {
            this.physics.add.collider(this.box, this.platforms);
            this.physics.add.collider(this.player, this.box);
            this.physics.add.collider(this.aiPartner, this.box);
        }

        // -----------------------------
        // FALL DETECTORS + restart overlaps
        // -----------------------------
        (L.fallDetectors || []).forEach(fd => {
            const r = this.add.rectangle(fd.x, fd.y, fd.width, fd.height, 0xff0000);
            this.physics.add.existing(r, true);
            r.setVisible(false);
            this.fallDetectors.push(r);

            const reset = () => this.scene.restart(this.scene.settings.data);
            this.physics.add.overlap(this.player, r, reset);
            this.physics.add.overlap(this.aiPartner, r, reset);
            if (this.box) this.physics.add.overlap(this.box, r, reset);
        });

        // -----------------------------
        // KEY PICKUP logic
        // -----------------------------
        if (this.keyObj) {
            const pickupKey = () => {
                if (this.keyObj) {
                    this.keyObj.destroy();
                    this.keyObj = null;
                }
                if (this.keySprite) {
                    this.keySprite.destroy();
                    this.keySprite = null;
                }
                this.hasKey = true;
            };
            this.physics.add.overlap(this.player, this.keyObj, pickupKey);
            this.physics.add.overlap(this.aiPartner, this.keyObj, pickupKey);
        }

        // -----------------------------
        // DOOR check logic
        // -----------------------------
        if (this.door) {
            const checkDoor = () => {
                if (this.hasKey && !this._doorOpening) {
                    this._doorOpening = true;
                    if (this.doorSprite) {
                        this.doorSprite.play("door_open");
                    }
                    this.time.delayedCall(500, () => this._onLevelComplete());
                }
            };
            this.physics.add.overlap(this.player, this.door, checkDoor);
            this.physics.add.overlap(this.aiPartner, this.door, checkDoor);
        }

        // -----------------------------
        // SWITCH → BRIDGE logic handled in update()
        // -----------------------------

        // -----------------------------
        // UI Buttons + Camera + Input
        // -----------------------------
        this._createUIButtons();
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.startTime = this.time.now;
        this.timerRunning = true;
        this.elapsedText = this.add.text(this.scale.width / 2, 30, "0.0s", { fontSize: "28px", fill: "#000000" }).setScrollFactor(0);

        // AI controller (uses physics bodies)
        this.aiBrain = new AICoopController(this, this.aiPartner, this.player);
    }

    _createUIButtons() {
        const homeBtn = this.add.text(60, 40, "Home", {
            fontSize: "22px",
            fill: "#fff",
            backgroundColor: "#3498db",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setScrollFactor(0).setInteractive();

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) window.showMainMenuUI();
        });

        const restartBtn = this.add.text(160, 40, "⟳", {
            fontSize: "22px",
            fill: "#fff",
            backgroundColor: "#e74c3c",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setScrollFactor(0).setInteractive();

        restartBtn.on("pointerdown", () => this.scene.restart(this.scene.settings.data));
    }

    // =====================================================
    // UPDATE LOOP
    // =====================================================
    update() {
        // AI update
        if (this.aiBrain) {
            this.aiBrain.update();
        }

        // Ensure physics body exists
        if (!this.player || !this.player.body) return;

        const speed = 250;
        const jumpSpeed = -475;

        this.player.body.setVelocityX(0);

        // Movement: arrow keys or WASD
        if (this.cursors.left.isDown || (this.keys && this.keys.A.isDown)) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || (this.keys && this.keys.D.isDown)) {
            this.player.body.setVelocityX(speed);
        }

        const isJumpPressed = this.cursors.up.isDown || (this.keys && this.keys.W.isDown) || (this.keys && this.keys.SPACE.isDown);
        if (isJumpPressed && this.player.body.blocked.down) {
            this.player.body.setVelocityY(jumpSpeed);
        }

        // Update sprite overlay positions + animation frames
        this._updateSpriteVisuals(this.player, this.playerSprite);
        this._updateSpriteVisuals(this.aiPartner, this.aiSprite);

        // Timer UI
        if (this.timerRunning && this.elapsedText) {
            const elapsed = (this.time.now - this.startTime) / 1000;
            this.elapsedText.setText(`${elapsed.toFixed(1)}s`);
        }

        // SWITCHES → ENABLE BRIDGE
        if (this.switchObj && this.switchObj.length > 0) {
            let anySwitchPressed = false;

            this.switchObj.forEach(sw => {
                const left = sw.x - (sw.width || 0) / 2;
                const right = sw.x + (sw.width || 0) / 2;
                const top = sw.y - (sw.height || 0) / 2;
                const bottom = sw.y + (sw.height || 0) / 2;

                const playerOn =
                    this.player &&
                    this.player.x > left &&
                    this.player.x < right &&
                    this.player.y + 25 >= top &&
                    this.player.y + 25 <= bottom + 6;

                const aiOn =
                    this.aiPartner &&
                    this.aiPartner.x > left &&
                    this.aiPartner.x < right &&
                    this.aiPartner.y + 25 >= top &&
                    this.aiPartner.y + 25 <= bottom + 6;

                const boxOn =
                    this.box &&
                    this.box.x > left &&
                    this.box.x < right &&
                    this.box.y + 25 >= top &&
                    this.box.y + 25 <= bottom + 6;

                if (playerOn || aiOn || boxOn) {
                    anySwitchPressed = true;
                    sw.setFillStyle(0x2ecc71);
                } else {
                    sw.setFillStyle(0x7f8c8d);
                }
            });

            this.bridgePieces.forEach(bp => {
                if (bp && bp.body) {
                    bp.body.enable = anySwitchPressed;
                }
                bp.setVisible(anySwitchPressed);
            });
        }
    }

    _updateSpriteVisuals(physBody, visualSprite) {
        if (!physBody || !visualSprite || !physBody.body) return;

        // Sync sprite to physics body
        visualSprite.x = physBody.x;
        visualSprite.y = physBody.y;

        const velX = physBody.body.velocity.x || 0;
        const onGround = physBody.body.blocked.down;
        const deadzone = 10;

        if (velX > deadzone) visualSprite.facing = "right";
        else if (velX < -deadzone) visualSprite.facing = "left";

        let desiredKey = null;
        if (!onGround) desiredKey = visualSprite.facing === "right" ? "RJ" : "LJ";
        else if (Math.abs(velX) > deadzone) desiredKey = visualSprite.facing === "right" ? "RW" : "LW";
        else desiredKey = visualSprite.facing === "right" ? "RS" : "LS";

        if (visualSprite.texture.key !== desiredKey && this.textures.exists(desiredKey)) {
            visualSprite.setTexture(desiredKey);
        }
    }

    // =====================================================
    // LEVEL COMPLETE
    // =====================================================
    _onLevelComplete() {
        // STOP TIMER
        this.timerRunning = false;

        // Disable physics movement
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
            this.player.body.moves = false;
        }
        if (this.aiPartner && this.aiPartner.body) {
            this.aiPartner.body.setVelocity(0, 0);
            this.aiPartner.body.moves = false;
        }

        const elapsed = (this.time.now - this.startTime) / 1000;
        let stars = 1;
        if (elapsed < 90) stars = 3;
        else if (elapsed < 150) stars = 2;

        const coins = stars === 3 ? 150 : (stars === 2 ? 75 : 50);

        const currentCoins = this.registry.get("coins") || 0;
        const updatedCoins = currentCoins + coins;
        this.registry.set("coins", updatedCoins);

        const bg = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            450,
            300,
            0x000000,
            0.7
        ).setScrollFactor(0).setOrigin(0.5);

        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 100,
            "Level Complete!",
            { fontSize: "40px", fill: "#2ecc71" }
        ).setOrigin(0.5).setScrollFactor(0);

        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 30,
            `Time: ${elapsed.toFixed(1)}s`,
            { fontSize: "28px", fill: "#fff" }
        ).setOrigin(0.5).setScrollFactor(0);

        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 20,
            `Stars: ${"⭐".repeat(stars)}`,
            { fontSize: "28px", fill: "#FFD700" }
        ).setOrigin(0.5).setScrollFactor(0);

        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 70,
            `Coins: ${coins}`,
            { fontSize: "28px", fill: "#f39c12" }
        ).setOrigin(0.5).setScrollFactor(0);

        const homeBtn = this.add.text(
            this.scale.width / 2 - 100,
            this.scale.height / 2 + 110,
            "Home",
            {
                fontSize: "24px",
                fill: "#fff",
                backgroundColor: "#3498db",
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) window.showMainMenuUI();
        });

        const restartBtn = this.add.text(
            this.scale.width / 2 + 100,
            this.scale.height / 2 + 110,
            "⟳",
            {
                fontSize: "24px",
                fill: "#fff",
                backgroundColor: "#e74c3c",
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);

        restartBtn.on("pointerdown", () => {
            this.scene.restart(this.scene.settings.data);
        });

        const username = this.registry.get("username");
        if (username) {
            fetch("http://localhost:5000/update-coins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, coins: updatedCoins })
            }).catch(() => {});
        }
    }
}