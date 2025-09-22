export default class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    preload() {
        // We can still preload assets here that might be needed later.
        // It's good practice to keep this, even if it's empty for now.
        this.load.image('background', 'assets/background.png');
    }

    create() {
        // This function is now empty.
        // Its old job of drawing the menu is now done by index.html and style.css.
        // This scene just runs silently in the background, waiting for instructions.
        console.log("HomeScene is running silently in the background...");
    }
}

