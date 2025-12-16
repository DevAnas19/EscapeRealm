// scenes/AIRaceScene.js

import AIRaceController from "./AI/AIRaceController.js";

export default class AIRaceScene extends Phaser.Scene {
    constructor() {
        super({ key: "AIRaceScene" });

        this.player = null;
        this.playerSprite = null;

        this.ai = null;
        this.aiSprite = null;

        this.platforms = null;
        this.movingPlatforms = [];
        this.verticalPlatforms = [];
        this.goal = null;
        this.goalSprite = null;
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
        this.canMove = false;
    }

    init(data) {
        this.level = data.level || 1;
    }

    preload() {
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
    }

    create() {
        const L = this.cache.json.get(`raceLevel_${this.level}`);

        const levelWidth = L.levelWidth || 2000;
        const levelHeight = this.scale.height;

        this.raceFinished = false;
        this.timerRunning = false;
        this.canMove = false;

        // world
        this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
        this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);

        // background
        if (this.textures.exists("background")) {
            const bg = this.add.image(levelWidth / 2, levelHeight / 2, "background");
            bg.setDisplaySize(levelWidth, levelHeight);
            bg.setDepth(-10);
        } else {
            this.cameras.main.setBackgroundColor("#87ceeb");
        }

        // ------------------------------
        // PLAYER (PHYSICS BODY + SPRITE)
        // ------------------------------
        this.player = this.add.rectangle(
            L.playerSpawn.x,
            L.playerSpawn.y,
            50,
            50
        );
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(500);

        this.playerSprite = this.add.sprite(L.playerSpawn.x, L.playerSpawn.y, "RS");
        this.playerSprite.setDisplaySize(50, 50);
        this.playerSprite.facing = "right";

        // ------------------------------
        // AI (PHYSICS BODY + SPRITE)
        // ------------------------------
        this.ai = this.add.rectangle(L.aiSpawn.x, L.aiSpawn.y, 50, 50);
        this.physics.add.existing(this.ai);
        this.ai.body.setCollideWorldBounds(true);
        this.ai.body.setGravityY(500);

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

            r._moveConfig = {
                minX: mp.minX ?? mp.x - 100,
                maxX: mp.maxX ?? mp.x + 100,
                speed: mp.speed || 100,
            };

            this.movingPlatforms.push(r);
        });

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

            r._moveConfig = {
                minY: vp.minY ?? vp.y - 100,
                maxY: vp.maxY ?? vp.y + 100,
                speed: vp.speed || 75,
            };

            this.verticalPlatforms.push(r);
        });

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.ai, this.platforms);

        this.movingPlatforms.forEach((mp) => {
            this.physics.add.collider(this.player, mp);
            this.physics.add.collider(this.ai, mp);
        });

        this.verticalPlatforms.forEach((vp) => {
            this.physics.add.collider(this.player, vp);
            this.physics.add.collider(this.ai, vp);
        });

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
            this.physics.add.overlap(this.player, fd, () => {
                this.player.setPosition(L.playerSpawn.x, L.playerSpawn.y);
                this.player.body.setVelocity(0, 0);
            });

            this.physics.add.overlap(this.ai, fd, () => {
                this.ai.setPosition(L.aiSpawn.x, L.aiSpawn.y);
                this.ai.body.setVelocity(0, 0);
            });
        });

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
            .setScrollFactor(0)
            .setInteractive();

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) window.showMainMenuUI();
        });

        const restartBtn = this.add
            .text(160, 40, "⟳", {
                fontSize: "22px",
                fill: "#fff",
                backgroundColor: "#e74c3c",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
            .setScrollFactor(0)
            .setInteractive();

        restartBtn.on("pointerdown", () => {
            this.scene.restart({ level: this.level });
        });

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

        this.startCountdown();
    }

    startCountdown() {
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
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.time.addEvent({
            delay: 1000,
            repeat: 5,
            callback: () => {
                this.countdown--;

                if (this.countdown > 0) {
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
        });
    }

    update() {
        if (!this.player || !this.player.body) return;

        const speed = 250;
        const jumpSpeed = -475;

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
        this.player.body.setVelocityX(0);

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.body.setVelocityY(jumpSpeed);
        }

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
            const elapsed = (this.time.now - this.startTime) / 1000;
            this.elapsedText.setText(`${elapsed.toFixed(1)}s`);
        }

        // AI logic
        if (this.aiBrain && !this.raceFinished && this.canMove) {
            this.aiBrain.update();
        }
    }

    onPlayerWin() {
        if (this.raceFinished) return;
        this._showRaceResult("Player");
    }

    onAIWin() {
        if (this.raceFinished) return;
        this._showRaceResult("AI");
    }

    _showRaceResult(winner) {
        this.raceFinished = true;
        this.timerRunning = false;

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

            const currentCoins = this.registry.get("coins") || 0;
            const updatedCoins = currentCoins + coins;
            this.registry.set("coins", updatedCoins);

            const username = this.registry.get("username");
            if (username) {
                fetch("http://localhost:5000/update-coins", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
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

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) window.showMainMenuUI();
        });

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

        restartBtn.on("pointerdown", () => {
            this.scene.restart({ level: this.level });
        });
    }
}