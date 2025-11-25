// scenes/AIRaceScene.js

import AIRaceController from "./AI/AIRaceController.js";

export default class AIRaceScene extends Phaser.Scene {
    constructor() {
        super({ key: "AIRaceScene" });

        this.player = null;
<<<<<<< HEAD
        this.playerSprite = null;

        this.ai = null;
        this.aiSprite = null;
=======
        this.ai = null;
>>>>>>> c708da216d29d8788d664af49d6e03819178b705

        this.platforms = null;
        this.movingPlatforms = [];
        this.verticalPlatforms = [];
        this.goal = null;
<<<<<<< HEAD
        this.goalSprite = null;
=======
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        this.fallDetectors = [];

        this.cursors = null;

        // timer / UI
        this.startTime = 0;
        this.elapsedText = null;
        this.timerRunning = false;

        // race state
        this.raceFinished = false;

        // countdown state
        this.countdownText = null;
        this.countdown = 5;
<<<<<<< HEAD
        this.canMove = false;
=======
        this.canMove = false; // movement locked until countdown ends
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
    }

    init(data) {
        this.level = data.level || 1;
    }

    preload() {
<<<<<<< HEAD
        this.cache.json.remove(`raceLevel_${this.level}`);

        // background
        this.load.image("background", "assets/background.png");

        // PLAYER / AI sprites
        this.load.image("RS", "assets/sprites/RS.png");
        this.load.image("LS", "assets/sprites/LS.png");
        this.load.image("RW", "assets/sprites/RW.png");
        this.load.image("LW", "assets/sprites/LW.png");
        this.load.image("RJ", "assets/sprites/RJ.png");
        this.load.image("LJ", "assets/sprites/LJ.png");

        // platforms / tiles
        this.load.image("ground", "assets/tiles/ground.png");
        this.load.image("moving", "assets/tiles/moving.png");

        // door sprite sheet (same as GameplayScene)
        this.load.spritesheet("door_anim", "assets/items/Door.png", {
            frameWidth: 64,
            frameHeight: 64,
        });

        // JSON level
        this.load.json(
            `raceLevel_${this.level}`,
            `scenes/Levels/AIRace/level${this.level}.json`
        );
=======
            // make sure old cache is removed
        this.cache.json.remove(`raceLevel_${this.level}`);
        this.load.image("background", "assets/background.png");

        // Load custom JSON (NOT Tiled)
        this.load.json(
        `raceLevel_${this.level}`,
        `scenes/Levels/AIRace/level${this.level}.json`
    );

>>>>>>> c708da216d29d8788d664af49d6e03819178b705
    }

    create() {
        const L = this.cache.json.get(`raceLevel_${this.level}`);

        const levelWidth = L.levelWidth || 2000;
        const levelHeight = this.scale.height;

<<<<<<< HEAD
=======
        // Reset state on create/restart
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        this.raceFinished = false;
        this.timerRunning = false;
        this.canMove = false;

<<<<<<< HEAD
        // world
        this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
        this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);

        // background
=======
        // WORLD BOUNDS
        this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
        this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);

        // Background (same style as other modes)
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        if (this.textures.exists("background")) {
            const bg = this.add.image(levelWidth / 2, levelHeight / 2, "background");
            bg.setDisplaySize(levelWidth, levelHeight);
            bg.setDepth(-10);
        } else {
            this.cameras.main.setBackgroundColor("#87ceeb");
        }

<<<<<<< HEAD
        // ------------------------------
        // PLAYER (PHYSICS BODY + SPRITE)
        // ------------------------------
        this.player = this.add.rectangle(
            L.playerSpawn.x,
            L.playerSpawn.y,
            50,
            50
        );
=======
        // -----------------------------
        // PLAYER (red block)
        // -----------------------------
        this.player = this.add.rectangle(L.playerSpawn.x, L.playerSpawn.y, 50, 50, 0xff0000);
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(500);

<<<<<<< HEAD
        this.playerSprite = this.add.sprite(L.playerSpawn.x, L.playerSpawn.y, "RS");
        this.playerSprite.setDisplaySize(50, 50);
        this.playerSprite.facing = "right";

        // ------------------------------
        // AI (PHYSICS BODY + SPRITE)
        // ------------------------------
        this.ai = this.add.rectangle(L.aiSpawn.x, L.aiSpawn.y, 50, 50);
=======
        // -----------------------------
        // AI (green block)
        // -----------------------------
        this.ai = this.add.rectangle(L.aiSpawn.x, L.aiSpawn.y, 50, 50, 0x00ff00);
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        this.physics.add.existing(this.ai);
        this.ai.body.setCollideWorldBounds(true);
        this.ai.body.setGravityY(500);

<<<<<<< HEAD
        this.aiSprite = this.add.sprite(L.aiSpawn.x, L.aiSpawn.y, "RS");
        this.aiSprite.setDisplaySize(50, 50);
        this.aiSprite.facing = "right";

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // ------------------------------
        // STATIC PLATFORMS (with ground texture)
        // ------------------------------
        this.platforms = this.physics.add.staticGroup();

        (L.platforms || []).forEach((p) => {
            // invisible physics rect
            const r = this.add.rectangle(p.x, p.y, p.width, p.height, 0x000000, 0);
            this.physics.add.existing(r, true);
            this.platforms.add(r);

            // tile the top surface with ground.png (32x32)
            const tileW = 32;
            const tilesCount = Math.ceil(p.width / tileW);

            const tileY = p.y - p.height / 2 + tileW / 2;
            const leftStart = p.x - p.width / 2 + tileW / 2;

            for (let i = 0; i < tilesCount; i++) {
                this.add.image(leftStart + i * tileW, tileY, "ground").setOrigin(0.5);
            }
        });

        // ------------------------------
        // MOVING PLATFORMS
        // ------------------------------
        this.movingPlatforms = [];
        (L.movingPlatforms || []).forEach((mp) => {
            const r = this.add.tileSprite(mp.x, mp.y, mp.width, mp.height, "moving");
            this.physics.add.existing(r);

            r.body.setImmovable(true);
            r.body.setAllowGravity(false);
            r.body.setVelocityX(mp.speed || 100);
=======
        // Camera follow player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // -----------------------------
        // STATIC PLATFORMS
        // -----------------------------
        this.platforms = this.physics.add.staticGroup();

        (L.platforms || []).forEach(p => {
            const r = this.add.rectangle(p.x, p.y, p.width, p.height, p.color ?? 0x2ecc71);
            this.physics.add.existing(r, true);
            this.platforms.add(r);
        });

        // -----------------------------
        // MOVING HORIZONTAL PLATFORMS
        // -----------------------------
        this.movingPlatforms = [];
        (L.movingPlatforms || []).forEach(mp => {
            const r = this.add.rectangle(mp.x, mp.y, mp.width, mp.height, mp.color ?? 0xe67e22);
            this.physics.add.existing(r);

            if (r.body) {
                r.body.setImmovable(true);
                r.body.setAllowGravity(false);
                r.body.setVelocityX(mp.speed || 100);
            }
>>>>>>> c708da216d29d8788d664af49d6e03819178b705

            r._moveConfig = {
                minX: mp.minX ?? mp.x - 100,
                maxX: mp.maxX ?? mp.x + 100,
<<<<<<< HEAD
                speed: mp.speed || 100,
=======
                speed: mp.speed || 100
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            };

            this.movingPlatforms.push(r);
        });

<<<<<<< HEAD
        // ------------------------------
        // VERTICAL PLATFORMS
        // ------------------------------
        this.verticalPlatforms = [];
        (L.verticalPlatforms || []).forEach((vp) => {
            const r = this.add.tileSprite(vp.x, vp.y, vp.width, vp.height, "moving");
            this.physics.add.existing(r);

            r.body.setImmovable(true);
            r.body.setAllowGravity(false);
            r.body.setVelocityY(vp.speed || 75);
=======
        // -----------------------------
        // VERTICAL PLATFORMS
        // -----------------------------
        this.verticalPlatforms = [];
        (L.verticalPlatforms || []).forEach(vp => {
            const r = this.add.rectangle(vp.x, vp.y, vp.width, vp.height, vp.color ?? 0x27ae60);
            this.physics.add.existing(r);

            if (r.body) {
                r.body.setImmovable(true);
                r.body.setAllowGravity(false);
                r.body.setVelocityY(vp.speed || 75);
            }
>>>>>>> c708da216d29d8788d664af49d6e03819178b705

            r._moveConfig = {
                minY: vp.minY ?? vp.y - 100,
                maxY: vp.maxY ?? vp.y + 100,
<<<<<<< HEAD
                speed: vp.speed || 75,
=======
                speed: vp.speed || 75
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            };

            this.verticalPlatforms.push(r);
        });

<<<<<<< HEAD
        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.ai, this.platforms);

        this.movingPlatforms.forEach((mp) => {
=======
        // -----------------------------
        // COLLISIONS
        // -----------------------------
        // Static platforms
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.ai, this.platforms);

        // Moving platforms
        this.movingPlatforms.forEach(mp => {
            if (!mp || !mp.body) return;
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            this.physics.add.collider(this.player, mp);
            this.physics.add.collider(this.ai, mp);
        });

<<<<<<< HEAD
        this.verticalPlatforms.forEach((vp) => {
=======
        // Vertical platforms
        this.verticalPlatforms.forEach(vp => {
            if (!vp || !vp.body) return;
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            this.physics.add.collider(this.player, vp);
            this.physics.add.collider(this.ai, vp);
        });

<<<<<<< HEAD
        // ------------------------------
        // GOAL (door with texture)
        // ------------------------------
        // physics body
        this.goal = this.add.rectangle(
            L.door.x,
            L.door.y,
            L.door.width,
            L.door.height,
            0x000000,
            0
        );
        this.physics.add.existing(this.goal, true);

        // door sprite
        this.goalSprite = this.add
            .sprite(L.door.x, L.door.y, "door_anim")
            .setOrigin(0.5)
            .setDepth(2);

        // scale similar to GameplayScene
        this.goalSprite.setDisplaySize(L.door.width * 2.0, L.door.height * 1.5);

        this.goal.setVisible(false); // hide collision rect

        if (!this.anims.exists("door_idle_race")) {
            this.anims.create({
                key: "door_idle_race",
                frames: this.anims.generateFrameNumbers("door_anim", {
                    start: 0,
                    end: 8,
                }),
                frameRate: 8,
                repeat: -1,
            });
        }
        this.goalSprite.play("door_idle_race");

        // win checks
        this.physics.add.overlap(this.player, this.goal, () => this.onPlayerWin());
        this.physics.add.overlap(this.ai, this.goal, () => this.onAIWin());

        // ------------------------------
        // FALL DETECTORS
        // ------------------------------
        this.fallDetectors = [];
        (L.fallDetectors || []).forEach((fd) => {
            const r = this.add.rectangle(fd.x, fd.y, fd.width, fd.height);
            r.setVisible(false);
            this.physics.add.existing(r, true);
            this.fallDetectors.push(r);
        });

        this.fallDetectors.forEach((fd) => {
=======
        // -----------------------------
        // GOAL (door)
        // -----------------------------
        this.goal = this.add.rectangle(L.door.x, L.door.y, L.door.width, L.door.height, 0x2980b9);
        this.physics.add.existing(this.goal, true);

        // Player wins if reaches goal
        this.physics.add.overlap(this.player, this.goal, () => this.onPlayerWin());

        // AI wins if reaches goal
        this.physics.add.overlap(this.ai, this.goal, () => this.onAIWin());

        // -----------------------------
        // FALL DETECTORS
        // -----------------------------
        this.fallDetectors = [];
        (L.fallDetectors || []).forEach(fd => {
            const r = this.add.rectangle(fd.x, fd.y, fd.width, fd.height);
            this.physics.add.existing(r, true);
            r.setVisible(false);
            this.fallDetectors.push(r);
        });

        this.fallDetectors.forEach(fd => {
            // reset player
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            this.physics.add.overlap(this.player, fd, () => {
                this.player.setPosition(L.playerSpawn.x, L.playerSpawn.y);
                this.player.body.setVelocity(0, 0);
            });
<<<<<<< HEAD

=======
            // reset AI
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            this.physics.add.overlap(this.ai, fd, () => {
                this.ai.setPosition(L.aiSpawn.x, L.aiSpawn.y);
                this.ai.body.setVelocity(0, 0);
            });
        });

<<<<<<< HEAD
        // ------------------------------
        // HUD BUTTONS
        // ------------------------------
        const homeBtn = this.add
            .text(60, 40, "Home", {
                fontSize: "22px",
                fill: "#fff",
                backgroundColor: "#3498db",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
=======
        // -----------------------------
        // TOP-LEFT HOME & RESTART (during race)
        // -----------------------------
        const homeBtn = this.add.text(60, 40, "Home", {
            fontSize: "22px",
            fill: "#fff",
            backgroundColor: "#3498db",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            .setScrollFactor(0)
            .setInteractive();

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) window.showMainMenuUI();
        });

<<<<<<< HEAD
        const restartBtn = this.add
            .text(160, 40, "⟳", {
                fontSize: "22px",
                fill: "#fff",
                backgroundColor: "#e74c3c",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
=======
        const restartBtn = this.add.text(160, 40, "⟳", {
            fontSize: "22px",
            fill: "#fff",
            backgroundColor: "#e74c3c",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            .setScrollFactor(0)
            .setInteractive();

        restartBtn.on("pointerdown", () => {
            this.scene.restart({ level: this.level });
        });

<<<<<<< HEAD
        this.elapsedText = this.add
            .text(this.scale.width / 2, 30, "0.0s", {
                fontSize: "28px",
                fill: "#000",
            })
            .setScrollFactor(0)
            .setOrigin(0.5);

        this.cursors = this.input.keyboard.createCursorKeys();

        // AI logic
        this.aiBrain = new AIRaceController(this, this.ai, L);

=======
        // -----------------------------
        // TIMER UI (top center)
        // -----------------------------
        this.startTime = 0;          // will be set after countdown
        this.timerRunning = false;   // start AFTER countdown

        this.elapsedText = this.add.text(
            this.scale.width / 2,
            30,
            "0.0s",
            { fontSize: "28px", fill: "#000" }
        ).setScrollFactor(0).setOrigin(0.5);

        // -----------------------------
        // INPUT
        // -----------------------------
        this.cursors = this.input.keyboard.createCursorKeys();

        // -----------------------------
        // AI CONTROLLER
        // -----------------------------
        this.aiBrain = new AIRaceController(this, this.ai, L);

        // -----------------------------
        // START 5s COUNTDOWN
        // -----------------------------
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        this.startCountdown();
    }

    startCountdown() {
<<<<<<< HEAD
        this.canMove = false;

        this.player.body.moves = false;
        this.ai.body.moves = false;

        this.countdown = 5;

        this.countdownText = this.add
            .text(this.scale.width / 2, this.scale.height / 2 - 150, "5", {
                fontSize: "90px",
                fontFamily: "Arial",
                fill: "#ffffff",
            })
=======
        // lock movement
        this.canMove = false;

        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
            this.player.body.moves = false;
        }
        if (this.ai && this.ai.body) {
            this.ai.body.setVelocity(0, 0);
            this.ai.body.moves = false;
        }

        // big centered countdown
        this.countdown = 5;

        this.countdownText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 150,
            this.countdown.toString(),
            {
                fontSize: "90px",
                fontFamily: "Arial",
                fill: "#ffffff"
            }
        )
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.time.addEvent({
            delay: 1000,
<<<<<<< HEAD
            repeat: 5,
=======
            repeat: 5, // will fire 6 times total (0..5)
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            callback: () => {
                this.countdown--;

                if (this.countdown > 0) {
<<<<<<< HEAD
                    this.countdownText.setText(this.countdown.toString());
                } else if (this.countdown === 0) {
                    this.countdownText.setText("GO!");
                } else {
                    this.countdownText.destroy();

                    this.canMove = true;
                    this.player.body.moves = true;
                    this.ai.body.moves = true;

                    this.startTime = this.time.now;
                    this.timerRunning = true;
                }
            },
=======
                    // 4,3,2,1
                    this.countdownText.setText(this.countdown.toString());
                } else if (this.countdown === 0) {
                    // GO!
                    this.countdownText.setText("GO!");
                } else {
                    // countdown < 0 → done
                    this.countdownText.destroy();

                    // allow movement
                    this.canMove = true;

                    if (this.player && this.player.body) {
                        this.player.body.moves = true;
                    }
                    if (this.ai && this.ai.body) {
                        this.ai.body.moves = true;
                    }

                    // now start race timer
                    this.startTime = this.time.now;
                    this.timerRunning = true;
                }
            }
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        });
    }

    update() {
        if (!this.player || !this.player.body) return;

        const speed = 250;
        const jumpSpeed = -475;

<<<<<<< HEAD
        // platform movement
        this.movingPlatforms.forEach((mp) => {
            const c = mp._moveConfig;
            if (mp.x >= c.maxX) mp.body.setVelocityX(-Math.abs(c.speed));
            else if (mp.x <= c.minX) mp.body.setVelocityX(Math.abs(c.speed));
        });

        this.verticalPlatforms.forEach((vp) => {
            const c = vp._moveConfig;
            if (vp.y >= c.maxY) vp.body.setVelocityY(-Math.abs(c.speed));
            else if (vp.y <= c.minY) vp.body.setVelocityY(Math.abs(c.speed));
        });

        // countdown freeze
        if (!this.canMove) {
            this.player.body.setVelocityX(0);
            this.ai.body.setVelocityX(0);
            return;
        }

        // PLAYER MOVEMENT
=======
        // -----------------------------
        // MOVE PLATFORMS (always, even during countdown)
        // -----------------------------
        this.movingPlatforms.forEach(mp => {
            if (!mp || !mp.body || !mp._moveConfig) return;
            const c = mp._moveConfig;
            if (mp.x >= c.maxX) {
                mp.body.setVelocityX(-Math.abs(c.speed));
            } else if (mp.x <= c.minX) {
                mp.body.setVelocityX(Math.abs(c.speed));
            }
        });

        this.verticalPlatforms.forEach(vp => {
            if (!vp || !vp.body || !vp._moveConfig) return;
            const c = vp._moveConfig;
            if (vp.y >= c.maxY) {
                vp.body.setVelocityY(-Math.abs(c.speed));
            } else if (vp.y <= c.minY) {
                vp.body.setVelocityY(Math.abs(c.speed));
            }
        });

        // If countdown not finished, freeze player/AI movement
        if (!this.canMove) {
            this.player.body.setVelocityX(0);
            if (this.ai && this.ai.body) {
                this.ai.body.setVelocityX(0);
            }
            // don't process further movement/AI yet
            return;
        }

        // -----------------------------
        // PLAYER MOVEMENT
        // -----------------------------
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        this.player.body.setVelocityX(0);

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.body.setVelocityY(jumpSpeed);
        }

<<<<<<< HEAD
        // ----------------------
        // PLAYER ANIMATION
        // ----------------------
        if (this.playerSprite) {
            const velX = this.player.body.velocity.x;
            const onGround = this.player.body.blocked.down;

            if (velX > 10) this.playerSprite.facing = "right";
            else if (velX < -10) this.playerSprite.facing = "left";

            let tex = "RS";
            if (!onGround) tex = this.playerSprite.facing === "right" ? "RJ" : "LJ";
            else if (Math.abs(velX) > 10)
                tex = this.playerSprite.facing === "right" ? "RW" : "LW";
            else tex = this.playerSprite.facing === "right" ? "RS" : "LS";

            this.playerSprite.setTexture(tex);
            this.playerSprite.x = this.player.x;
            this.playerSprite.y = this.player.y;
        }

        // ----------------------
        // AI ANIMATION
        // ----------------------
        if (this.aiSprite) {
            const velX = this.ai.body.velocity.x;
            const onGround = this.ai.body.blocked.down;

            if (velX > 10) this.aiSprite.facing = "right";
            else if (velX < -10) this.aiSprite.facing = "left";

            let tex = "RS";
            if (!onGround) tex = this.aiSprite.facing === "right" ? "RJ" : "LJ";
            else if (Math.abs(velX) > 10)
                tex = this.aiSprite.facing === "right" ? "RW" : "LW";
            else tex = this.aiSprite.facing === "right" ? "RS" : "LS";

            this.aiSprite.setTexture(tex);
            this.aiSprite.x = this.ai.x;
            this.aiSprite.y = this.ai.y;
        }

        // timer
        if (this.timerRunning) {
=======
        // -----------------------------
        // TIMER UPDATE
        // -----------------------------
        if (this.timerRunning && this.elapsedText) {
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            const elapsed = (this.time.now - this.startTime) / 1000;
            this.elapsedText.setText(`${elapsed.toFixed(1)}s`);
        }

<<<<<<< HEAD
        // AI logic
=======
        // -----------------------------
        // AI UPDATE (only when race active)
        // -----------------------------
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
        if (this.aiBrain && !this.raceFinished && this.canMove) {
            this.aiBrain.update();
        }
    }

<<<<<<< HEAD
=======
    // ================================
    // WIN HANDLERS
    // ================================
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
    onPlayerWin() {
        if (this.raceFinished) return;
        this._showRaceResult("Player");
    }

    onAIWin() {
        if (this.raceFinished) return;
        this._showRaceResult("AI");
    }

<<<<<<< HEAD
=======
    // ================================
    // RACE RESULT SCOREBOARD
    // ================================
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
    _showRaceResult(winner) {
        this.raceFinished = true;
        this.timerRunning = false;

<<<<<<< HEAD
        this.player.body.setVelocity(0);
        this.ai.body.setVelocity(0);

        this.player.body.moves = false;
        this.ai.body.moves = false;

        const elapsed = (this.time.now - this.startTime) / 1000;

        let stars = 0;
        let coins = 0;
        let winnerText = "";
        let winnerColor = "#fff";

        if (winner === "Player") {
            stars = elapsed < 90 ? 3 : elapsed < 150 ? 2 : 1;
            coins = stars === 3 ? 150 : stars === 2 ? 75 : 50;

            winnerText = "You Won the Race!";
            winnerColor = "#2ecc71";
=======
        // Stop movement
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
            this.player.body.moves = false;
        }
        if (this.ai && this.ai.body) {
            this.ai.body.setVelocity(0, 0);
            this.ai.body.moves = false;
        }

        const elapsed = (this.time.now - this.startTime) / 1000;

        // Default: no reward (for AI win)
        let stars = 0;
        let coins = 0;
        let winnerText = "";
        let winnerColor = "#ffffff";
        let timeLine = "";

        if (winner === "Player") {
            // Reward logic same as single player / co-op
            stars = 1;
            if (elapsed < 90) stars = 3;
            else if (elapsed < 150) stars = 2;

            coins = stars === 3 ? 150 : (stars === 2 ? 75 : 50);
>>>>>>> c708da216d29d8788d664af49d6e03819178b705

            const currentCoins = this.registry.get("coins") || 0;
            const updatedCoins = currentCoins + coins;
            this.registry.set("coins", updatedCoins);

<<<<<<< HEAD
=======
            // Save to backend if username exists
>>>>>>> c708da216d29d8788d664af49d6e03819178b705
            const username = this.registry.get("username");
            if (username) {
                fetch("http://localhost:5000/update-coins", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
                    body: JSON.stringify({ username, coins: updatedCoins }),
                }).catch(() => {});
            }
        } else {
            winnerText = "AI Finished First!";
            winnerColor = "#e74c3c";
        }

        // POPUP
        const bg = this.add
            .rectangle(
                this.scale.width / 2,
                this.scale.height / 2,
                450,
                300,
                0x000000,
                0.7
            )
            .setScrollFactor(0)
            .setOrigin(0.5);

        this.add
            .text(this.scale.width / 2, this.scale.height / 2 - 110, "Race Finished!", {
                fontSize: "36px",
                fill: "#fff",
            })
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.add
            .text(this.scale.width / 2, this.scale.height / 2 - 60, winnerText, {
                fontSize: "32px",
                fill: winnerColor,
            })
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.add
            .text(
                this.scale.width / 2,
                this.scale.height / 2 - 10,
                `Your Time: ${elapsed.toFixed(1)}s`,
                { fontSize: "24px", fill: "#fff" }
            )
            .setOrigin(0.5)
            .setScrollFactor(0);

        const homeBtn = this.add
            .text(this.scale.width / 2 - 100, this.scale.height / 2 + 120, "Home", {
                fontSize: "24px",
                fill: "#fff",
                backgroundColor: "#3498db",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
            .setOrigin(0.5)
            .setInteractive()
            .setScrollFactor(0);
=======
                    body: JSON.stringify({ username, coins: updatedCoins })
                }).catch(() => { });
            }

            winnerText = "You Won the Race!";
            winnerColor = "#2ecc71";
            timeLine = `Your Time: ${elapsed.toFixed(1)}s`;
        } else {
            // AI wins → no coins, no stars
            winnerText = "AI Finished First!";
            winnerColor = "#e74c3c";
            timeLine = `Your Time: ${elapsed.toFixed(1)}s`;
            stars = 0;
            coins = 0;
        }

        // Background popup
        const bg = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            450,
            300,
            0x000000,
            0.7
        ).setScrollFactor(0).setOrigin(0.5);

        // Title
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 110,
            "Race Finished!",
            { fontSize: "36px", fill: "#ffffff" }
        ).setOrigin(0.5).setScrollFactor(0);

        // Winner line
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 60,
            winnerText,
            { fontSize: "32px", fill: winnerColor }
        ).setOrigin(0.5).setScrollFactor(0);

        // Time line
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 10,
            timeLine,
            { fontSize: "24px", fill: "#ffffff" }
        ).setOrigin(0.5).setScrollFactor(0);

        // Stars / coins lines
        if (winner === "Player") {
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 + 30,
                `Stars: ${"⭐".repeat(stars)}`,
                { fontSize: "24px", fill: "#FFD700" }
            ).setOrigin(0.5).setScrollFactor(0);

            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 + 70,
                `Coins: ${coins}`,
                { fontSize: "24px", fill: "#f39c12" }
            ).setOrigin(0.5).setScrollFactor(0);
        } else {
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 + 30,
                `Stars: None`,
                { fontSize: "24px", fill: "#7f8c8d" }
            ).setOrigin(0.5).setScrollFactor(0);

            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 + 70,
                `Coins: 0`,
                { fontSize: "24px", fill: "#7f8c8d" }
            ).setOrigin(0.5).setScrollFactor(0);
        }

        // Home button
        const homeBtn = this.add.text(
            this.scale.width / 2 - 100,
            this.scale.height / 2 + 120,
            "Home",
            {
                fontSize: "24px",
                fill: "#fff",
                backgroundColor: "#3498db",
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);
>>>>>>> c708da216d29d8788d664af49d6e03819178b705

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) window.showMainMenuUI();
        });

<<<<<<< HEAD
        const restartBtn = this.add
            .text(this.scale.width / 2 + 100, this.scale.height / 2 + 120, "⟳", {
                fontSize: "24px",
                fill: "#fff",
                backgroundColor: "#e74c3c",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
            .setOrigin(0.5)
            .setInteractive()
            .setScrollFactor(0);
=======
        // Restart button
        const restartBtn = this.add.text(
            this.scale.width / 2 + 100,
            this.scale.height / 2 + 120,
            "⟳",
            {
                fontSize: "24px",
                fill: "#fff",
                backgroundColor: "#e74c3c",
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }
        ).setOrigin(0.5).setInteractive().setScrollFactor(0);
>>>>>>> c708da216d29d8788d664af49d6e03819178b705

        restartBtn.on("pointerdown", () => {
            this.scene.restart({ level: this.level });
        });
    }
}
