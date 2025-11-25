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
    //player
    this.load.image("RS", "assets/sprites/RS.png");
    this.load.image("LS", "assets/sprites/LS.png");
    this.load.image("RW", "assets/sprites/RW.png");
    this.load.image("LW", "assets/sprites/LW.png");
    this.load.image("RJ", "assets/sprites/RJ.png");
    this.load.image("LJ", "assets/sprites/LJ.png");

    // key + key animation sheet

    this.load.spritesheet("key_anim", "assets/items/KeyFly.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // door animation sheet (14 frames, 64x64 each)
    this.load.spritesheet("door_anim", "assets/items/Door.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    //floor
    this.load.image("ground", "assets/tiles/ground.png");
    //platform
    
    this.load.image("box", "assets/tiles/box.png");
    this.load.image("moving", "assets/tiles/moving.png");
    this.load.image("bridge", "assets/tiles/bridge.png");
    this.load.spritesheet("switch", "assets/tiles/switch.png", {
      frameWidth: 60,
      frameHeight: 20,
  });
  }
  create(data = {}) {
    // --- FIX: RESET VARIABLES ON RESTART ---
    this.hasKey = false;
    this._doorOpening = false;
    this.timerRunning = false;
    // ---------------------------------------

    const mode = data.mode || "single_player";
    const levelNum = data.level || 1;

    let folder = "";

    // Match your EXACT folder names
    if (mode === "ai_race") folder = "Levels/AIRace";
    else if (mode === "ai_coop") folder = "Levels/AICoop";
    else folder = "Levels/Single_player"; // single player

    const levelPath = `scenes/${folder}/level${levelNum}.json`;

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
      const bg = this.add.image(
        levelWidth / 2,
        this.scale.height / 2,
        "background"
      );
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

    // --- Replace red box visual with sprite (keep physics on this.player) ---
    this.playerSprite = this.add
      .sprite(this.player.x, this.player.y, "RS")
      .setOrigin(0.5, 0.5);
    if (this.player && this.player.body) {
      this.playerSprite.setDisplaySize(
        this.player.body.width,
        this.player.body.height
      );
    }
    this.player.setVisible(false);
    this.playerSprite.facing = "right";
    this.playerSprite.setDepth(1);

    // -----------------------------
    // PLATFORMS
    // -----------------------------
// PLATFORMS (top-surface tiled) — REPLACE your existing platforms loop with this
this.platforms = this.physics.add.staticGroup();
(L.platforms || []).forEach((p) => {
  // physics rectangle (invisible) - used for collisions
  const r = this.add.rectangle(p.x, p.y, p.width, p.height, 0x000000, 0);
  this.physics.add.existing(r, true);
  this.platforms.add(r);

  // tile the top surface using 32x32 tiles
  const tileW = 32; // your ground.png size
  const tilesCount = Math.ceil(p.width / tileW);

  // place tiles so their top aligns with the top of the physics rect
  // physics rect origin is center -> topY = p.y - p.height/2
  // tile center Y = topY + tileW/2
  const tileY = p.y - p.height / 2 + tileW / 2;
  const leftStart = p.x - p.width / 2 + tileW / 2;

  for (let i = 0; i < tilesCount; i++) {
    this.add.image(leftStart + i * tileW, tileY, "ground").setOrigin(0.5);
  }
});


    // -----------------------------
    // MOVING HORIZONTAL PLATFORMS
    // -----------------------------
    (L.movingPlatforms || []).forEach((mp) => {
      // Use tileSprite to repeat the texture pattern
      const r = this.add.tileSprite(
        mp.x,
        mp.y,
        mp.width,
        mp.height,
        "moving" // <--- Your new image
      );
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
 (L.verticalPlatforms || []).forEach((vp) => {
      const r = this.add.tileSprite(
        vp.x,
        vp.y,
        vp.width,
        vp.height,
        "moving" // <--- Reuse the metal texture
      );
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
// BOX
    this.box = null;
    if (L.box) {
      // Use the "box" image instead of a rectangle
      this.box = this.add.sprite(
        L.box.x,
        L.box.y,
        "box"
      );
      this.physics.add.existing(this.box);

      if (this.box.body) {
        this.box.body.setCollideWorldBounds(true);
        this.box.body.setBounce(0);
        this.box.body.setDragX(L.box.dragX || 700);
        if (L.box.mass) this.box.body.setMass(L.box.mass);
        
        // Match physics body to the image size (50x50)
        this.box.body.setSize(50, 50);
      }
    }
    // -----------------------------
    // KEY
    // -----------------------------
    this.keyObj = null;
    if (L.key) {
      this.keyObj = this.add.rectangle(
        L.key.x,
        L.key.y,
        L.key.width || 30,
        L.key.height || 30,
        0xf1c40f
      );
      this.physics.add.existing(this.keyObj);
      if (this.keyObj.body) {
        this.keyObj.body.setAllowGravity(false);
        this.keyObj.body.setImmovable(true);
      }
    }

    // --- key visual + animation (physics stays on this.keyObj) ---
    if (this.keyObj) {
      this.keySprite = this.add
        .sprite(this.keyObj.x, this.keyObj.y, "key_anim")
        .setOrigin(0.5, 0.5);
      this.keySprite.setDisplaySize(this.keyObj.width, this.keyObj.height);
      this.keyObj.setVisible(false);
      this.keySprite.setDepth(1);
      this.keySprite.setScale(1.3);

      // create anim only once
      if (!this.anims.exists("key_spin")) {
        this.anims.create({
          key: "key_spin",
          frames: this.anims.generateFrameNumbers("key_anim", {
            start: 0,
            end: 3,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }

      this.keySprite.play("key_spin");
    }

    // -----------------------------
    // DOOR
    // -----------------------------
    this.door = null;
    if (L.door) {
      this.door = this.add.rectangle(
        L.door.x,
        L.door.y,
        L.door.width || 50,
        L.door.height || 80,
        0x2980b9
      );
      this.physics.add.existing(this.door, true);
    }
    // --- door visual sprite + idle animation ---
    if (this.door) {
      this.doorSprite = this.add
        .sprite(this.door.x, this.door.y, "door_anim")
        .setOrigin(0.5, 0.5);
      this.doorSprite.setDisplaySize(
        this.door.width * 2.0,
        this.door.height * 1.5
      );

      this.door.setVisible(false); // hide the blue block
      this.doorSprite.setDepth(1);

      // create idle loop anim once
      if (!this.anims.exists("door_idle")) {
        this.anims.create({
          key: "door_idle",
          frames: this.anims.generateFrameNumbers("door_anim", {
            start: 0,
            end: 8,
          }), // frames 1–9
          frameRate: 8,
          repeat: -1,
        });
      }

      this.doorSprite.play("door_idle");
    }

    // -----------------------------
    // SWITCH
    // -----------------------------
    this.switchObj = [];

    (L.switch || []).forEach((sw) => {
      const s = this.add.rectangle(
        sw.x,
        sw.y,
        sw.width || 60,
        sw.height || 20,
        0x7f8c8d
      );
      this.physics.add.existing(s, true);
      this.switchObj.push(s);
    });

    // -----------------------------
    // BRIDGE
    // -----------------------------
 // BRIDGE
    this.bridgePieces = [];
    (L.bridge || []).forEach((b) => {
      // Use tileSprite so the bridge texture repeats for long bridges
      const r = this.add.tileSprite(
        b.x,
        b.y,
        b.width,
        b.height,
        "bridge"
      );
      this.physics.add.existing(r, true);

      if (r.body) {
        r.body.enable = b.initiallyEnabled ?? false;
      }
      // Hide if disabled
      r.setVisible(r.body ? r.body.enable : b.initiallyEnabled ?? false);

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
    if (this.player && this.platforms)
      this.physics.add.collider(this.player, this.platforms);

    // moving & vertical & bridge collisions (player)
    this.movingPlatforms.forEach((mp) => {
      if (mp && mp.body && this.player)
        this.physics.add.collider(this.player, mp);
    });
    this.verticalPlatforms.forEach((vp) => {
      if (vp && vp.body && this.player)
        this.physics.add.collider(this.player, vp);
    });
    this.bridgePieces.forEach((bp) => {
      if (bp && bp.body && this.player)
        this.physics.add.collider(this.player, bp);
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
        this.keySprite.destroy(); // <--- ADD THIS LINE
        this.hasKey = true;
      });
    }// door -> finish (with open animation)
    if (this.door && this.player) {
      this.physics.add.overlap(this.player, this.door, () => {
        if (!this.hasKey) return; // require key
        if (this._doorOpening) return; // already opening

        this._doorOpening = true;

        // stop idle loop
        if (this.doorSprite) this.doorSprite.stop();

        // create open anim once (frames 10..14 => indices 9..13)
        if (!this.anims.exists("door_open")) {
          this.anims.create({
            key: "door_open",
            frames: this.anims.generateFrameNumbers("door_anim", {
              start: 9,
              end: 13,
            }),
            frameRate: 20,
            repeat: 0,
          });
        }

        // Play animation
        if (this.doorSprite) {
            this.doorSprite.play("door_open");
        }

        // --- THE FIX IS HERE ---
        // We use a Timer (delayedCall) instead of "animationcomplete".
        // This forces the level to finish after 0.5 seconds (500ms) no matter what.
        this.time.delayedCall(500, () => {
            // 1. Lock visual frame
            if (this.doorSprite) this.doorSprite.setFrame(13);

            // 2. Remove door physics/blocker
            if (this.door) {
              this.door.destroy();
              this.door = null;
            }

            // 3. Hide/remove player visually and physically
            if (this.playerSprite) {
              this.playerSprite.destroy();
              this.playerSprite = null;
            }
            if (this.player) {
              if (this.player.body) this.player.body.enable = false;
              this.player.destroy();
              this.player = null;
            }

            // 4. Stop camera
            this.cameras.main.stopFollow();

            // 5. Finish level
            this._onLevelComplete();
        });
      });
    }
    // fall detectors -> restart
    this.fallDetectors.forEach((fd) => {
      if (fd && this.player)
        this.physics.add.overlap(this.player, fd, () =>
          this.scene.restart(this.scene.settings.data)
        );
      if (fd && this.box)
        this.physics.add.overlap(this.box, fd, () =>
          this.scene.restart(this.scene.settings.data)
        );
    });

    // -----------------------------
    // IN-GAME HOME & RESTART BUTTONS
    // -----------------------------

    // HOME button
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
      if (window.showMainMenuUI) {
        window.showMainMenuUI(); // Go back to the main menu
      }
    });

    // RESTART button
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
      this.scene.restart(this.scene.settings.data); // Restart level
    });

    // -----------------------------
    // UI & INPUT
    // -----------------------------
    this.startTime = this.time.now;
    this.elapsedText = this.add
      .text(this.scale.width / 2, 30, "0.0s", {
        fontSize: "28px",
        fill: "#000",
      })
      .setScrollFactor(0);
    this.starsText = this.add
      .text(this.scale.width / 2, 70, "", { fontSize: "28px", fill: "#FFD700" })
      .setScrollFactor(0);

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
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        "Level Complete!",
        { fontSize: "40px", fill: "#2ecc71" }
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 30,
        `Time: ${elapsed.toFixed(1)}s`,
        { fontSize: "28px", fill: "#fff" }
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 20,
        `Stars: ${"⭐".repeat(stars)}`,
        { fontSize: "28px", fill: "#f1c40f" }
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 70,
        `Coins: ${coins}`,
        { fontSize: "28px", fill: "#f39c12" }
      )
      .setOrigin(0.5)
      .setScrollFactor(0);

    const homeBtn = this.add
      .text(this.scale.width / 2 - 100, this.scale.height / 2 + 110, "Home", {
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
      .text(this.scale.width / 2 + 100, this.scale.height / 2 + 110, "⟳", {
        fontSize: "24px",
        fill: "#fff",
        backgroundColor: "#e74c3c",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .setScrollFactor(0);
    restartBtn.on("pointerdown", () =>
      this.scene.restart(this.scene.settings.data)
    );

    // Save coins (best effort)
    const username = this.registry.get("username");
    if (username) {
      fetch("http://localhost:5000/update-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, coins: updatedCoins }),
      }).catch(() => {});
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

    if (
      this.cursors &&
      (this.cursors.left.isDown || (this.keys && this.keys.A.isDown))
    ) {
      this.player.body.setVelocityX(-speed);
    } else if (
      this.cursors &&
      (this.cursors.right.isDown || (this.keys && this.keys.D.isDown))
    ) {
      this.player.body.setVelocityX(speed);
    }

    if (
      ((this.cursors && this.cursors.up.isDown) ||
        (this.keys && this.keys.W.isDown) ||
        (this.keys && this.keys.SPACE.isDown)) &&
      this.player.body.blocked &&
      this.player.body.blocked.down
    ) {
      this.player.body.setVelocityY(jumpSpeed);
    }

    // --- sync sprite position and set texture based on state ---
    if (this.playerSprite && this.player && this.player.body) {
      // place sprite on physics body
      this.playerSprite.x = this.player.x;
      this.playerSprite.y = this.player.y;

      const velX =
        (this.player.body.velocity && this.player.body.velocity.x) || 0;
      // const velY = (this.player.body.velocity && this.player.body.velocity.y) || 0;
      const onGround = !!(
        this.player.body.blocked && this.player.body.blocked.down
      );
      const deadzone = 10;

      // update facing
      if (velX > deadzone) this.playerSprite.facing = "right";
      else if (velX < -deadzone) this.playerSprite.facing = "left";

      // choose texture
      let desiredKey = null;
      if (!onGround) {
        desiredKey = this.playerSprite.facing === "right" ? "RJ" : "LJ";
      } else if (Math.abs(velX) > deadzone) {
        desiredKey = this.playerSprite.facing === "right" ? "RW" : "LW";
      } else {
        desiredKey = this.playerSprite.facing === "right" ? "RS" : "LS";
      }

      if (
        this.playerSprite.texture &&
        this.playerSprite.texture.key !== desiredKey
      ) {
        this.playerSprite.setTexture(desiredKey);
      }

      // keep display size matched to physics body
      if (this.player.body)
        this.playerSprite.setDisplaySize(
          this.player.body.width,
          this.player.body.height
        );
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

      this.switchObj.forEach((sw) => {
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
      this.bridgePieces.forEach((bp) => {
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
