// scenes/GameplayScene.js
export default class GameplayScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameplayScene" });

    this.player = null;
    this.cursors = null;
    this.keys = null;

    this.platforms = null;
    this.movingPlatforms = [];
    this.verticalPlatforms = [];

    this.bridgePieces = [];
    this.box = null;

    this.keyObj = null;
    this.door = null;
    this.switchObj = null;

    this.fallDetectors = [];

    this.startTime = 0;
    this.elapsedText = null;
    this.timerRunning = false;
    this.hasKey = false;

    this.levelData = null;
  }

  preload() {
    this.load.image("background", "assets/background.png");
  }

  create(data = {}) {
    const mode = data.mode || "single_player";
    const levelNum = data.level || 1;

    const levelPath = `scenes/levels/${mode}/level${levelNum}.json`;

    fetch(levelPath)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load level: ${levelPath}`);
        return res.json();
      })
      .then((levelData) => {
        this.levelData = levelData;
        this._setupLevel();
      })
      .catch((err) => {
        console.error(err);
        this.add
          .text(20, 20, `Error loading ${levelPath}`, {
            fontSize: "20px",
            fill: "#ff0000",
          })
          .setScrollFactor(0);
      });
  }

  // ================================================
  //              LEVEL SETUP FROM JSON
  // ================================================
  _setupLevel() {
    const L = this.levelData || {};

    const levelWidth = L.levelWidth || 3000;
    const levelHeight = this.scale.height;

    this.physics.world.setBounds(0, 0, levelWidth, levelHeight);
    this.cameras.main.setBounds(0, 0, levelWidth, levelHeight);

    if (this.textures.exists("background")) {
      const bg = this.add.image(levelWidth / 2, this.scale.height / 2, "background");
      bg.setDisplaySize(levelWidth, this.scale.height);
      bg.setDepth(-10);
    } else {
      this.cameras.main.setBackgroundColor("#87ceeb");
    }

    // -----------------------------
    // PLAYER
    // -----------------------------
    const spawn = L.playerSpawn || { x: 100, y: 100 };

    this.player = this.add.rectangle(spawn.x, spawn.y, 50, 50, 0xff0000);
    this.physics.add.existing(this.player);

    // Ensure physics body size/offset exist for rectangle
    if (this.player.body) {
      this.player.body.setSize(50, 50);
      // Offset depends on origin; rectangles default origin is 0.5 center in Phaser
      this.player.body.setOffset(0, 0);
    }

    this.player.body && this.player.body.setCollideWorldBounds(true);
    this.player.body && this.player.body.setBounce(0);
    this.player.body && this.player.body.setGravityY(500);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // -----------------------------
    // PLATFORMS
    // -----------------------------
    this.platforms = this.physics.add.staticGroup();

    (L.platforms || []).forEach((p) => {
      const r = this.add.rectangle(p.x, p.y, p.width, p.height, p.color ?? 0x2ecc71);
      this.physics.add.existing(r, true);
      this.platforms.add(r);
    });

    // -----------------------------
    // MOVING HORIZONTAL PLATFORMS
    // -----------------------------
    this.movingPlatforms = []; // reset to be safe
    (L.movingPlatforms || []).forEach((mp) => {
      const r = this.add.rectangle(mp.x, mp.y, mp.width, mp.height, mp.color ?? 0xe67e22);
      this.physics.add.existing(r);

      if (r.body) {
        r.body.setImmovable(true);
        r.body.setAllowGravity(false);
        r.body.setVelocityX(mp.speed || 100);
      }

      r._moveConfig = {
        minX: mp.minX ?? mp.x - 100,
        maxX: mp.maxX ?? mp.x + 100,
        speed: mp.speed || 100,
      };

      this.movingPlatforms.push(r);
    });

    // -----------------------------
    // VERTICAL PLATFORMS
    // -----------------------------
    this.verticalPlatforms = [];
    (L.verticalPlatforms || []).forEach((vp) => {
      const r = this.add.rectangle(vp.x, vp.y, vp.width, vp.height, vp.color ?? 0x27ae60);
      this.physics.add.existing(r);

      if (r.body) {
        r.body.setImmovable(true);
        r.body.setAllowGravity(false);
        r.body.setVelocityY(vp.speed || 75);
      }

      r._moveConfig = {
        minY: vp.minY ?? vp.y - 100,
        maxY: vp.maxY ?? vp.y + 100,
        speed: vp.speed || 75,
      };

      this.verticalPlatforms.push(r);
    });

    // -----------------------------
    // BOX
    // -----------------------------
    this.box = null;
    if (L.box) {
      this.box = this.add.rectangle(L.box.x, L.box.y, L.box.width || 50, L.box.height || 50, 0x964b00);
      this.physics.add.existing(this.box);

      if (this.box.body) {
        this.box.body.setCollideWorldBounds(true);
        this.box.body.setBounce(0);
        this.box.body.setDragX(L.box.dragX || 700);
        if (L.box.mass) this.box.body.setMass(L.box.mass);
      }
    }

    // -----------------------------
    // KEY
    // -----------------------------
    this.keyObj = null;
    if (L.key) {
      this.keyObj = this.add.rectangle(L.key.x, L.key.y, L.key.width || 30, L.key.height || 30, 0xf1c40f);
      this.physics.add.existing(this.keyObj);
      if (this.keyObj.body) {
        this.keyObj.body.setAllowGravity(false);
        this.keyObj.body.setImmovable(true);
      }
    }

    // -----------------------------
    // DOOR
    // -----------------------------
    this.door = null;
    if (L.door) {
      this.door = this.add.rectangle(L.door.x, L.door.y, L.door.width || 50, L.door.height || 80, 0x2980b9);
      this.physics.add.existing(this.door, true);
    }

    // -----------------------------
    // SWITCH
    // -----------------------------
    this.switchObj = [];

    (L.switch || []).forEach(sw => {
      const s = this.add.rectangle(sw.x, sw.y, sw.width || 60, sw.height || 20, 0x7f8c8d);
      this.physics.add.existing(s, true);
      this.switchObj.push(s);
    });

    // -----------------------------
    // BRIDGE
    // -----------------------------
    this.bridgePieces = [];
    (L.bridge || []).forEach((b) => {
      const r = this.add.rectangle(b.x, b.y, b.width, b.height, b.color ?? 0x95a5a6);
      this.physics.add.existing(r, true);

      // ensure body exists before touching enable
      if (r.body) {
        r.body.enable = b.initiallyEnabled ?? false;
      }
      r.setVisible(r.body ? r.body.enable : (b.initiallyEnabled ?? false));

      this.bridgePieces.push(r);
    });

    // -----------------------------
    // FALL DETECTORS
    // -----------------------------
    this.fallDetectors = [];
    (L.fallDetectors || []).forEach((fd) => {
      const r = this.add.rectangle(fd.x, fd.y, fd.width, fd.height, 0xff0000);
      this.physics.add.existing(r, true);
      r.setVisible(false);
      this.fallDetectors.push(r);
    });

    // -----------------------------
    // COLLISIONS
    // -----------------------------
    // player/platforms
    if (this.player && this.platforms) this.physics.add.collider(this.player, this.platforms);

    // moving & vertical & bridge collisions (player)
    this.movingPlatforms.forEach((mp) => {
      if (mp && mp.body && this.player) this.physics.add.collider(this.player, mp);
    });
    this.verticalPlatforms.forEach((vp) => {
      if (vp && vp.body && this.player) this.physics.add.collider(this.player, vp);
    });
    this.bridgePieces.forEach((bp) => {
      if (bp && bp.body && this.player) this.physics.add.collider(this.player, bp);
    });

    // box collisions
    if (this.box) {
      if (this.platforms) this.physics.add.collider(this.box, this.platforms);
      if (this.player) this.physics.add.collider(this.player, this.box);

      this.movingPlatforms.forEach((mp) => {
        if (mp && mp.body) this.physics.add.collider(this.box, mp);
      });
      this.verticalPlatforms.forEach((vp) => {
        if (vp && vp.body) this.physics.add.collider(this.box, vp);
      });
      this.bridgePieces.forEach((bp) => {
        if (bp && bp.body) this.physics.add.collider(this.box, bp);
      });
    }

    // key pickup
    if (this.keyObj && this.player) {
      this.physics.add.overlap(this.player, this.keyObj, () => {
        this.keyObj.destroy();
        this.hasKey = true;
      });
    }

    // door -> finish
    if (this.door && this.player) {
      this.physics.add.overlap(this.player, this.door, () => {
        if (this.hasKey) this._onLevelComplete();
      });
    }

    // fall detectors -> restart
    this.fallDetectors.forEach((fd) => {
      if (fd && this.player) this.physics.add.overlap(this.player, fd, () => this.scene.restart(this.scene.settings.data));
      if (fd && this.box) this.physics.add.overlap(this.box, fd, () => this.scene.restart(this.scene.settings.data));
    });

    // -----------------------------
    // IN-GAME HOME & RESTART BUTTONS
    // -----------------------------

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
    // UI & INPUT
    // -----------------------------
    this.startTime = this.time.now;
    this.elapsedText = this.add.text(this.scale.width / 2, 30, "0.0s", { fontSize: "28px", fill: "#000" }).setScrollFactor(0);
    this.starsText = this.add.text(this.scale.width / 2, 70, "", { fontSize: "28px", fill: "#FFD700" }).setScrollFactor(0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

    this.timerRunning = true;
  }

  // ================================================
  //                LEVEL COMPLETE
  // ================================================
  _onLevelComplete() {
    if (this.player && this.player.body) {
      this.player.body.setVelocity(0, 0);
      this.player.body.moves = false;
    }
    this.timerRunning = false;

    const elapsed = (this.time.now - this.startTime) / 1000;

    let stars = 1;
    if (elapsed < 90) stars = 3;
    else if (elapsed < 150) stars = 2;

    const coins = stars === 3 ? 150 : stars === 2 ? 75 : 50;

    const currentCoins = this.registry.get("coins") || 0;
    const updatedCoins = currentCoins + coins;

    this.registry.set("coins", updatedCoins);

    const bg = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 450, 300, 0x000000, 0.7).setScrollFactor(0).setOrigin(0.5);

    this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, "Level Complete!", { fontSize: "40px", fill: "#2ecc71" }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 30, `Time: ${elapsed.toFixed(1)}s`, { fontSize: "28px", fill: "#fff" }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, `Stars: ${"⭐".repeat(stars)}`, { fontSize: "28px", fill: "#f1c40f" }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, `Coins: ${coins}`, { fontSize: "28px", fill: "#f39c12" }).setOrigin(0.5).setScrollFactor(0);

    const homeBtn = this.add.text(this.scale.width / 2 - 100, this.scale.height / 2 + 110, "Home", { fontSize: "24px", fill: "#fff", backgroundColor: "#3498db", padding: { left: 10, right: 10, top: 5, bottom: 5 } }).setOrigin(0.5).setInteractive().setScrollFactor(0);
    homeBtn.on("pointerdown", () => { if (window.showMainMenuUI) window.showMainMenuUI(); });

    const restartBtn = this.add.text(this.scale.width / 2 + 100, this.scale.height / 2 + 110, "⟳", { fontSize: "24px", fill: "#fff", backgroundColor: "#e74c3c", padding: { left: 10, right: 10, top: 5, bottom: 5 } }).setOrigin(0.5).setInteractive().setScrollFactor(0);
    restartBtn.on("pointerdown", () => this.scene.restart(this.scene.settings.data));

    // Save coins (best effort)
    const username = this.registry.get("username");
    if (username) {
      fetch("http://localhost:5000/update-coins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, coins: updatedCoins }) }).catch(() => {});
    }
  }

  // ================================================
  //                  UPDATE LOOP
  // ================================================
  update() {
    // ensure core objects exist
    if (!this.player || !this.player.body) return;

    const speed = 250;
    const jumpSpeed = -475;

    // -----------------------------
    // PLAYER MOVEMENT
    // -----------------------------
    if (this.player.body) this.player.body.setVelocityX(0);

    if (this.cursors && (this.cursors.left.isDown || (this.keys && this.keys.A.isDown))) {
      this.player.body.setVelocityX(-speed);
    } else if (this.cursors && (this.cursors.right.isDown || (this.keys && this.keys.D.isDown))) {
      this.player.body.setVelocityX(speed);
    }

    if ((this.cursors && this.cursors.up.isDown || (this.keys && this.keys.W.isDown) || (this.keys && this.keys.SPACE.isDown)) && this.player.body.blocked && this.player.body.blocked.down) {
      this.player.body.setVelocityY(jumpSpeed);
    }

    // -----------------------------
    // MOVING PLATFORMS
    // -----------------------------
    this.movingPlatforms.forEach((mp) => {
      if (!mp || !mp._moveConfig || !mp.body) return;
      const c = mp._moveConfig;
      if (mp.x >= c.maxX) mp.body.setVelocityX(-Math.abs(c.speed));
      else if (mp.x <= c.minX) mp.body.setVelocityX(Math.abs(c.speed));
    });

    // -----------------------------
    // VERTICAL PLATFORMS
    // -----------------------------
    this.verticalPlatforms.forEach((vp) => {
      if (!vp || !vp._moveConfig || !vp.body) return;
      const c = vp._moveConfig;
      if (vp.y >= c.maxY) vp.body.setVelocityY(-Math.abs(c.speed));
      else if (vp.y <= c.minY) vp.body.setVelocityY(Math.abs(c.speed));
    });

    // -----------------------------
    // TIMER
    // -----------------------------
    if (this.timerRunning && this.elapsedText) {
      const elapsed = (this.time.now - this.startTime) / 1000;
      this.elapsedText.setText(`${elapsed.toFixed(1)}s`);
    }

    // -----------------------------
    // SWITCH → ENABLE BRIDGE
    // -----------------------------
    // -----------------------------
    // SWITCH → ENABLE BRIDGE
    // -----------------------------
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

        const boxOn =
          this.box &&
          this.box.x > left &&
          this.box.x < right &&
          this.box.y + 25 >= top &&
          this.box.y + 25 <= bottom + 6;

        if (playerOn || boxOn) {
          anySwitchPressed = true;
          sw.setFillStyle(0x2ecc71);
        } else {
          sw.setFillStyle(0x7f8c8d);
        }

      });

      // ENABLE / DISABLE BRIDGE
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
}
