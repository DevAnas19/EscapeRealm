import AICoopController from './AI/AICoopController.js';

export default class AICoopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AICoopScene' });

        this.player = null;
        this.aiPartner = null;

        this.platforms = null;
        this.bridgePieces = [];
        this.box = null;
        this.keyObj = null;
        this.door = null;
        this.switchObj = [];

        this.levelData = null;
        this.fallDetectors = [];

        // timer / UI
        this.startTime = 0;
        this.elapsedText = null;
        this.timerRunning = false;

        this.cursors = null;
    }

    init(data) {
        this.level = data.level || 1;
    }

    preload() {
        this.load.image("background", "assets/background.png");
    }

    create() {
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
                this.add.text(20, 20, "Failed to load AI-Coop level", {
                    fontSize: "20px",
                    fill: "#ff0000"
                });
            });
    }

    // =====================================================
    // LEVEL SETUP
    // =====================================================
    _setupLevel() {
        const L = this.levelData;

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
        // PLAYER
        // -----------------------------
        const spawn = L.playerSpawn || { x: 100, y: 100 };

        this.player = this.add.rectangle(spawn.x, spawn.y, 50, 50, 0xff0000);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(500);

        // -----------------------------
        // AI PARTNER
        // -----------------------------
        this.aiPartner = this.add.rectangle(spawn.x + 60, spawn.y, 50, 50, 0x00ff00);
        this.physics.add.existing(this.aiPartner);
        this.aiPartner.body.setCollideWorldBounds(true);
        this.aiPartner.body.setGravityY(500);

        // -----------------------------
        // PLATFORMS
        // -----------------------------
        this.platforms = this.physics.add.staticGroup();

        (L.platforms || []).forEach(p => {
            const r = this.add.rectangle(p.x, p.y, p.width, p.height, p.color ?? 0x2ecc71);
            this.physics.add.existing(r, true);
            this.platforms.add(r);
        });

        // -----------------------------
        // FALL DETECTORS
        // -----------------------------
        this.fallDetectors = [];

        (L.fallDetectors || []).forEach(fd => {
            const r = this.add.rectangle(fd.x, fd.y, fd.width, fd.height, 0xff0000);
            this.physics.add.existing(r, true);
            r.setVisible(false);           // invisible but active
            this.fallDetectors.push(r);
        });

        // Add overlaps for restart
        this.fallDetectors.forEach(fd => {
            if (this.player)
                this.physics.add.overlap(this.player, fd, () => this.scene.restart(this.scene.settings.data));

            if (this.aiPartner)
                this.physics.add.overlap(this.aiPartner, fd, () => this.scene.restart(this.scene.settings.data));

            if (this.box)
                this.physics.add.overlap(this.box, fd, () => this.scene.restart(this.scene.settings.data));
        });


        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.aiPartner, this.platforms);
        this.physics.add.collider(this.player, this.aiPartner);
        

        // -----------------------------
        // BOX
        // -----------------------------
        if (L.box) {
            this.box = this.add.rectangle(L.box.x, L.box.y, L.box.width, L.box.height, 0x964b00);
            this.physics.add.existing(this.box);

            const body = this.box.body;
            body.setCollideWorldBounds(true);

            // SLIPPERY SETTINGS (LOW FRICTION)
            body.setMass(0.7);     // ← makes box easier to push
            body.setDragX(550);     // ← reduces friction (slides more)
            body.setBounce(0);

            // collisions
            this.physics.add.collider(this.box, this.platforms);
            this.physics.add.collider(this.player, this.box);
            this.physics.add.collider(this.aiPartner, this.box);
        }


        // -----------------------------
        // KEY
        // -----------------------------
        if (L.key) {
            this.keyObj = this.add.rectangle(L.key.x, L.key.y, L.key.width, L.key.height, 0xf1c40f);
            this.physics.add.existing(this.keyObj);
            this.keyObj.body.setAllowGravity(false);
            this.keyObj.body.setImmovable(true);
        }

        // -----------------------------
        // DOOR
        // -----------------------------
        if (L.door) {
            this.door = this.add.rectangle(L.door.x, L.door.y, L.door.width, L.door.height, 0x2980b9);
            this.physics.add.existing(this.door, true);
        }

        // -------- KEY PICKUP --------
        this.hasKey = false;

        if (this.keyObj) {
            this.physics.add.overlap(this.player, this.keyObj, () => {
                this.keyObj.destroy();
                this.keyObj = null;
                this.hasKey = true;
            });

            this.physics.add.overlap(this.aiPartner, this.keyObj, () => {
                this.keyObj.destroy();
                this.keyObj = null;
                this.hasKey = true;
                console.log("AI: I got the key!");
            });
        }

        // ----- DOOR OVERLAP -----
        if (this.door) {
            this.physics.add.overlap(this.player, this.door, () => {
                if (this.hasKey) this._onLevelComplete();
            });

            this.physics.add.overlap(this.aiPartner, this.door, () => {
                if (this.hasKey) this._onLevelComplete();
            });
        }

        // -----------------------------
        // SWITCH
        // -----------------------------
        this.switchObj = [];
        (L.switch || []).forEach(sw => {
            const s = this.add.rectangle(sw.x, sw.y, sw.width, sw.height, 0x7f8c8d);
            this.physics.add.existing(s, true);
            this.switchObj.push(s);
        });

        // -------- BRIDGE PIECES --------
        this.bridgePieces = [];
        (L.bridge || []).forEach(b => {
            const r = this.add.rectangle(b.x, b.y, b.width, b.height, 0x95a5a6);
            this.physics.add.existing(r, true);

            if (r.body) {
                r.body.enable = b.initiallyEnabled ?? false;
            }
            r.setVisible(b.initiallyEnabled ?? false);

            this.bridgePieces.push(r);
        });

        // -----------------------------
        // BRIDGE COLLISIONS
        // -----------------------------
        this.bridgePieces.forEach(bp => {
            if (bp && bp.body) {

                // Player ↔ Bridge
                this.physics.add.collider(this.player, bp);

                // AI ↔ Bridge
                this.physics.add.collider(this.aiPartner, bp);

                // Box ↔ Bridge
                if (this.box)
                    this.physics.add.collider(this.box, bp);
            }
        });


        // HOME button
        const homeBtn = this.add.text(60, 40, "Home", {
            fontSize: "22px",
            fill: "#fff",
            backgroundColor: "#3498db",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
        .setScrollFactor(0)
        .setInteractive();

        homeBtn.on("pointerdown", () => {
            if (window.showMainMenuUI) {
                window.showMainMenuUI(); // Go back to the main menu
            }
        });

        // RESTART button
        const restartBtn = this.add.text(160, 40, "⟳", {
            fontSize: "22px",
            fill: "#fff",
            backgroundColor: "#e74c3c",
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
        .setScrollFactor(0)
        .setInteractive();

        restartBtn.on("pointerdown", () => {
            this.scene.restart(this.scene.settings.data); // Restart level
        });


        // -----------------------------
        // CAMERA
        // -----------------------------
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // -----------------------------
        // INPUT
        // -----------------------------
        this.cursors = this.input.keyboard.createCursorKeys();

        // -----------------------------
        // TIMER UI
        // -----------------------------
        this.startTime = this.time.now;
        this.timerRunning = true;

        this.elapsedText = this.add.text(
            this.scale.width / 2,
            30,
            "0.0s",
            { fontSize: "28px", fill: "#000000" }
        ).setScrollFactor(0);

        // -----------------------------
        // AI CONTROLLER
        // -----------------------------
        this.aiBrain = new AICoopController(this, this.aiPartner, this.player);
    }

    // =====================================================
    // UPDATE LOOP
    // =====================================================
    update() {
        // AI brain
        if (this.aiBrain) {
            this.aiBrain.update();
        }

        // Player movement only runs if body exists
        if (!this.player || !this.player.body) return;

        const speed = 250;
        const jumpSpeed = -475;

        this.player.body.setVelocityX(0);

        if (this.cursors) {
            if (this.cursors.left.isDown) {
                this.player.body.setVelocityX(-speed);
            } else if (this.cursors.right.isDown) {
                this.player.body.setVelocityX(speed);
            }

            if (this.cursors.up.isDown && this.player.body.blocked.down) {
                this.player.body.setVelocityY(jumpSpeed);
            }
        }

        // TIMER UPDATE
        if (this.timerRunning && this.elapsedText) {
            const elapsed = (this.time.now - this.startTime) / 1000;
            this.elapsedText.setText(`${elapsed.toFixed(1)}s`);
        }

        // =============================
        // SWITCH → ENABLE BRIDGE
        // =============================
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
                if (anySwitchPressed) {
                    bp.body.enable = true;
                    bp.setVisible(true);
                } else {
                    bp.body.enable = false;
                    bp.setVisible(false);
                }
            });
        }
    }

    // =====================================================
    // LEVEL COMPLETE
    // =====================================================
    _onLevelComplete() {
        // STOP TIMER
        this.timerRunning = false;

        // Stop movement
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
