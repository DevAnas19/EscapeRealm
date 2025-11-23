export default class AICoopController {
    constructor(scene, ai, player) {
        this.scene = scene;
        this.ai = ai;
        this.player = player;

        // Start by following the player
        this.state = "follow";
        this.stopAI = false;

        this.speed = 160;
        this.jumpSpeed = -475;

        this.announcedDoor = false;   // prevent door spam
        this.boostReady = false;      // for "help me" boost jump

        // set up chat input slightly after DOM is ready
        setTimeout(() => this._setupCommandListener(), 150);
    }

    // ======================================================
    //              PLAYER CHAT COMMAND LISTENER
    // ======================================================
    _setupCommandListener() {
        const input = document.getElementById("chatInput");
        if (!input) {
            console.warn("chatInput not found in HTML");
            return;
        }

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const cmd = input.value.trim().toLowerCase();
                input.value = "";
                if (cmd.length > 0) this._handleCommand(cmd);
            }
        });
    }

    _handleCommand(cmd) {
        if (cmd.includes("follow")) {
            this.state = "follow";
            this.boostReady = false;
            this._say("Okay! I'm following you!");
        }
        else if (cmd.includes("stop")) {
            this.state = "idle";
            this.boostReady = false;
            this._say("I'll stay here.");
        }
        else if (cmd.includes("get key")) {
            this.state = "get_key";
            this.boostReady = false;
            this._say("Going to the key!");
        }
        else if (cmd.includes("press switch") || cmd.includes("switch")) {
            this.state = "go_switch";
            this.boostReady = false;
            this._say("Going to the switch!");
        }
        else if (cmd.includes("come here")) {
            this.state = "follow";
            this.boostReady = false;
            this._say("Coming!");
        }
        else if (cmd.includes("push box")) {
            if (this.scene.box) {
                this.state = "assist_box";
                this.boostReady = false;
                this._say("I'll help you push the box!");
            } else {
                this._say("I don't see any box.");
            }
        }
        else if (cmd.includes("help me")) {
            this.state = "boost_help";
            this.boostReady = false;
            this._say("Okay, get on top of me!");
        }
        else {
            this._say("I didn't understand that.");
        }
    }

    // ======================================================
    //                          CHAT
    // ======================================================
    _say(text) {
        console.log("AI:", text);
        // later: route this to a UI chat box
    }

    // ======================================================
    //                   HELPER FUNCTIONS
    // ======================================================

    // Simple X-distance
    _dx(targetX) {
        return targetX - this.ai.x;
    }

    // Check if there's ground under the point in front of the AI
    _isGap(dir) {
        if (!this.scene.platforms) return false;

        const checkX = this.ai.x + (dir > 0 ? 24 : -24);
        const checkY = this.ai.y + 35;

        let ground = false;

        const platforms = this.scene.platforms.getChildren();
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            const w = p.displayWidth || p.width || 0;
            const h = p.displayHeight || p.height || 0;

            const left = p.x - w / 2;
            const right = p.x + w / 2;
            const top = p.y - h / 2;
            const bottom = p.y + h / 2;

            if (checkX >= left && checkX <= right &&
                checkY >= top && checkY <= bottom) {
                ground = true;
                break;
            }
        }

        // also treat bridge pieces as ground
        if (!ground && this.scene.bridgePieces) {
            this.scene.bridgePieces.forEach(bp => {
                if (!bp.visible) return;
                const w = bp.displayWidth || bp.width || 0;
                const h = bp.displayHeight || bp.height || 0;

                const left = bp.x - w / 2;
                const right = bp.x + w / 2;
                const top = bp.y - h / 2;
                const bottom = bp.y + h / 2;

                if (checkX >= left && checkX <= right &&
                    checkY >= top && checkY <= bottom) {
                    ground = true;
                }
            });
        }

        return !ground; // true if there's a gap
    }

    // Move horizontally toward a target X, with gap check
    _moveHorizTowards(targetX, tolerance) {
        const dx = targetX - this.ai.x;
        if (Math.abs(dx) <= (tolerance || 10)) {
            this.ai.body.setVelocityX(0);
            return;
        }

        const dir = dx > 0 ? 1 : -1;

        // don't walk off edges
        if (this._isGap(dir)) {
            this.ai.body.setVelocityX(0);
            return;
        }

        this.ai.body.setVelocityX(dir * this.speed);
    }

    // ======================================================
    //                       MAIN UPDATE
    // ======================================================
    update() {
        if (!this.ai || !this.ai.body || this.stopAI) return;

        switch (this.state) {
            case "follow":
                this._followPlayer();
                break;
            case "get_key":
                this._goToKey();
                break;
            case "go_switch":
                this._goToSwitch();
                break;
            case "go_door":
                this._goToDoor();
                break;
            case "assist_box":
                this._assistBox();
                break;
            case "boost_help":
                this._boostHelper();
                break;
            case "idle":
                this.ai.body.setVelocityX(0);
                break;
        }

        // Auto go-door only once after key obtained,
        // and only if not doing a special action
        if (this.scene.hasKey &&
            !this.announcedDoor &&
            this.state !== "get_key" &&
            this.state !== "assist_box" &&
            this.state !== "boost_help") {

            this.announcedDoor = true;
            this.state = "go_door";
            this._say("Heading to the door!");
        }

        // Extra logic for boost jump when ready
        if (this.state === "boost_help" && this.boostReady) {
            this._checkBoostJump();
        }
    }

    // ======================================================
    //                     BEHAVIORS
    // ======================================================

    // 1. Follow player smartly (tries not to sit on you)
    _followPlayer() {
        const desiredOffset = 60;  // stay a bit behind / ahead
        const dx = this.player.x - this.ai.x;

        // If too close, don't push the player
        if (Math.abs(dx) < desiredOffset) {
            this.ai.body.setVelocityX(0);
        } else {
            const targetX = this.player.x - Math.sign(dx) * desiredOffset;
            this._moveHorizTowards(targetX, 10);
        }

        // (Optional) mimic jump a bit if player jumps
        if (this.player.body && this.player.body.velocity.y < -120 && this.ai.body.blocked.down) {
            this.ai.body.setVelocityY(this.jumpSpeed);
        }
    }

    // 2. Go to key
    _goToKey() {
        const key = this.scene.keyObj;
        if (!key || !key.body) {
            this._say("I can't find the key anymore!");
            this.state = "idle";
            return;
        }

        this._moveHorizTowards(key.x, 20);

        if (Math.abs(this._dx(key.x)) < 20) {
            this.ai.body.setVelocityX(0);
            this.state = "idle";
        }
    }

    // 3. Go to first switch
    _goToSwitch() {
        const switches = this.scene.switchObj;
        if (!switches || switches.length === 0) {
            this._say("I don't see any switch.");
            this.state = "idle";
            return;
        }

        const sw = switches[0];
        this._moveHorizTowards(sw.x, 15);

        if (Math.abs(this._dx(sw.x)) < 15) {
            this.ai.body.setVelocityX(0);
            this.state = "idle";
        }
    }

    // 4. Go to door
    _goToDoor() {
        const door = this.scene.door;
        if (!door) {
            this.state = "idle";
            return;
        }

        this._moveHorizTowards(door.x, 25);

        if (Math.abs(this._dx(door.x)) < 25) {
            this.ai.body.setVelocityX(0);
            this.state = "idle";
        }
    }

    // 5. Assist pushing box with player
    _assistBox() {
        const box = this.scene.box;
        const player = this.player;
        if (!box || !box.body || !player || !player.body) {
            this.state = "idle";
            return;
        }

        const boxWidth = box.displayWidth || box.width || 50;
        let targetX;

        // Stand opposite side to player
        if (player.x < box.x) {
            // player on left, AI on right
            targetX = box.x + boxWidth / 2 + 25;
        } else {
            // player on right, AI on left
            targetX = box.x - boxWidth / 2 - 25;
        }

        const distToSpot = Math.abs(this._dx(targetX));

        if (distToSpot > 15) {
            this._moveHorizTowards(targetX, 12);
        } else {
            // In position: match player's horizontal movement to help push
            this.ai.body.setVelocityX(player.body.velocity.x);
        }
    }

    // 6. Boost jump helper ("help me")
    _boostHelper() {
        const player = this.player;
        if (!player || !player.body) {
            this.state = "idle";
            return;
        }

        // Step 1: move under the player
        const targetX = player.x;
        const distX = Math.abs(this._dx(targetX));

        if (distX > 20) {
            this._moveHorizTowards(targetX, 15);
            this.boostReady = false;
        } else {
            // close enough horizontally
            this.ai.body.setVelocityX(0);
            this.boostReady = true;
        }
    }

    // Called while state === "boost_help" and boostReady === true
    _checkBoostJump() {
        const player = this.player;
        if (!player || !player.body) return;

        // Is player above AI and kind of "standing" on/near it?
        const closeHoriz = Math.abs(player.x - this.ai.x) < 30;
        const playerAbove = player.y < this.ai.y - 30;

        if (!closeHoriz || !playerAbove) return;

        // When player jumps, AI jumps too to boost them
        if (player.body.velocity.y < -150 && this.ai.body.blocked.down) {
            this.ai.body.setVelocityY(this.jumpSpeed);
            this._say("Boosting you!");
            this.boostReady = false;
            // stay in boost state until user changes, or you could:
            // this.state = "follow";
        }
    }
}
