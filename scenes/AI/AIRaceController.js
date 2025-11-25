// scenes/AI/AIRaceController.js

export default class AIRaceController {
    constructor(scene, ai, levelData) {
        this.scene = scene;
        this.ai = ai;

        this.levelData = levelData;

        this.speed = 248;
        this.jumpPower = -475;

        this.goalX = levelData.door.x;
        this.finished = false;
    }

    update() {
        if (this.finished) return;
        if (!this.ai.body) return;

        const body = this.ai.body;
        const onGround = body.blocked.down;

        // ------------------------------------------------------------------------------------
        // 1. DETERMINE MOVE DIRECTION
        // ------------------------------------------------------------------------------------
        const direction = this.goalX > this.ai.x ? 1 : -1;
        body.setVelocityX(this.speed * direction);

        // ------------------------------------------------------------------------------------
        // 2. PLATFORM DETECTION (STATIC + MOVING + VERTICAL)
        // ------------------------------------------------------------------------------------
        const lookAheadX = this.ai.x + (direction === 1 ? 40 : -40);
        const lookAheadY = this.ai.y + 55;

        let groundAhead = false;

        // Helper: check rectangle overlap
        const checkRect = (plat) => {
            const left = plat.x - plat.width / 2;
            const right = plat.x + plat.width / 2;
            const top = plat.y - plat.height / 2;
            const bottom = plat.y + plat.height / 2;

            return (
                lookAheadX > left &&
                lookAheadX < right &&
                lookAheadY > top &&
                lookAheadY < bottom
            );
        };

        // Static platforms
        this.scene.platforms.getChildren().forEach(p => {
            if (checkRect(p)) groundAhead = true;
        });

        // Moving horizontal platforms
        this.scene.movingPlatforms.forEach(p => {
            if (checkRect(p)) groundAhead = true;
        });

        // Vertical platforms
        this.scene.verticalPlatforms.forEach(p => {
            if (checkRect(p)) groundAhead = true;
        });

        // ------------------------------------------------------------------------------------
        // 3. JUMP LOGIC
        // ------------------------------------------------------------------------------------

        // 3A. Jump across gaps
        if (!groundAhead && onGround) {
            body.setVelocityY(this.jumpPower);
        }

        // 3B. Jump ONTO higher platforms
        const targetPlatform = this._platformAbove();

        if (targetPlatform && onGround) {
            // Platform is slightly above → jump to reach it
            body.setVelocityY(this.jumpPower);
        }

        // ------------------------------------------------------------------------------------
        // 4. WIN CONDITION
        // ------------------------------------------------------------------------------------
        if (Math.abs(this.ai.x - this.goalX) < 40) {
            this.finished = true;
            body.setVelocity(0, 0);
            this.scene.onAIWin();
        }
    }

    // =====================================================================================
    // FIND PLATFORM ABOVE (for jumping up onto raised platforms)
    // =====================================================================================
    _platformAbove() {
        const searchX = this.ai.x;
        const searchY = this.ai.y - 10; // check slightly above AI

        const check = (p) => {
            const left = p.x - p.width / 2;
            const right = p.x + p.width / 2;
            const top = p.y - p.height / 2;

            // Platform above AI but reachable
            return searchX > left && searchX < right && top < this.ai.y && top > this.ai.y - 80;
        };

        // static platforms
        for (const p of this.scene.platforms.getChildren()) {
            if (check(p)) return p;
        }

        // moving platforms
        for (const p of this.scene.movingPlatforms) {
            if (check(p)) return p;
        }

        // vertical platforms
        for (const p of this.scene.verticalPlatforms) {
            if (check(p)) return p;
        }

        return null;
    }
}
