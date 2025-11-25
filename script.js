// === DOM ELEMENTS ===
const container = document.getElementById('container');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');

const authWrapper = document.getElementById('auth-wrapper');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');

const uiContainer = document.getElementById("ui-container");
const gameContainer = document.getElementById("game-container");
const usernameDisplay = document.getElementById("player-username");
const coinsDisplay = document.getElementById("player-coins");

// === SLIDING ANIMATION ===
if (signUpBtn && signInBtn && container) {
    signUpBtn.addEventListener('click', () => container.classList.add("active"));
    signInBtn.addEventListener('click', () => container.classList.remove("active"));
}

// === AUTHENTICATION LOGIC ===
let phaserGame = null;

function handleLoginSuccess(username, coins) {
    window.playerName = username;
    
    // 1. Hide Login Screen
    if (authWrapper) authWrapper.style.display = 'none';
    
    // 2. Ensure Game Container is HIDDEN
    if (gameContainer) gameContainer.style.display = 'none';
    
    // 3. Show Main Menu UI
    if (uiContainer) uiContainer.classList.remove("hidden");
    
    // 4. Update Text
    if (usernameDisplay) usernameDisplay.textContent = username;
    if (coinsDisplay) coinsDisplay.textContent = `${coins} 🪙`;

    // 5. Initialize Phaser (It will start on the empty 'BootScene')
    if (!phaserGame && typeof window.initPhaserGame === "function") {
        phaserGame = window.initPhaserGame(username, coins);
    }
}

// Login Listener
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            loginMessage.textContent = "Fill all fields.";
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (res.ok) {
                handleLoginSuccess(data.username, data.coins);
            } else {
                loginMessage.textContent = data.message || "Login failed.";
            }
        } catch (error) {
            console.error(error);
            loginMessage.textContent = "Server offline.";
        }
    });
}

// Signup Listener
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value.trim();

        if (!username || !password) {
            signupMessage.textContent = "Fill all fields.";
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (res.ok) {
                handleLoginSuccess(username, 0);
            } else {
                signupMessage.textContent = data.message || "Signup failed.";
            }
        } catch (error) {
            console.error(error);
            signupMessage.textContent = "Server offline.";
        }
    });
}

// === UI NAVIGATION ===
const modalOverlay = document.getElementById("modal-overlay");
const modalContainer = document.getElementById("modal-container");
const shopPanel = document.getElementById("shop-panel");
const aboutPanel = document.getElementById("about-panel");
const settingsPanel = document.getElementById("settings-panel");
const mainMenuPanel = document.getElementById("main-menu");
const levelSelectPanel = document.getElementById("level-select-panel");
const levelSelectTitle = document.getElementById("level-select-title");

let selectedMode = "single_player";

function uiModeToFolder(modeLabel) {
    const label = (modeLabel || "").toLowerCase();
    if (label.includes("single")) return "single_player";
    if (label.includes("coop")) return "ai_coop";
    if (label.includes("player") && label.includes("ai")) return "ai_race";
    return "single_player";
}

function openModal(panelElement) {
    if (!panelElement) return;
    document.querySelectorAll("#modal-container .panel").forEach(p => p.classList.remove("active"));
    panelElement.classList.add("active");
    modalOverlay.classList.remove("hidden");
    modalContainer.classList.remove("hidden");
}

function closeModal() {
    modalOverlay.classList.add("hidden");
    modalContainer.classList.add("hidden");
}

// Button Listeners
document.getElementById("shop-btn")?.addEventListener("click", () => openModal(shopPanel));
document.getElementById("about-btn")?.addEventListener("click", () => openModal(aboutPanel));
document.getElementById("settings-btn")?.addEventListener("click", () => openModal(settingsPanel));

document.querySelectorAll("#modal-container .back-button").forEach(btn => {
    btn.addEventListener("click", closeModal);
});

document.querySelectorAll(".mode-button").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedMode = uiModeToFolder(btn.dataset.mode);
        if (levelSelectTitle) levelSelectTitle.textContent = btn.dataset.mode;
        mainMenuPanel.classList.remove("active");
        levelSelectPanel.classList.add("active");
    });
});

document.querySelector("#level-select-panel .back-button")?.addEventListener("click", () => {
    levelSelectPanel.classList.remove("active");
    mainMenuPanel.classList.add("active");
});

// === START LEVEL LOGIC ===
document.querySelectorAll(".level-button").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!phaserGame) return;
        
        // 1. Hide UI
        uiContainer.classList.add("hidden");
        
        // 2. Show Game Canvas
        gameContainer.style.display = "block";
        
        // 3. Start the Actual Game Scene
        // We use 'start' to stop whatever scene is running (BootScene) and start GameplayScene
        const sceneKey = "GameplayScene";
        const sceneConfig = { mode: selectedMode, level: Number(btn.textContent) };
        
        phaserGame.scene.start(sceneKey, sceneConfig);
    });
});

// Global: Return to Main Menu
window.showMainMenuUI = function () {
    if (!phaserGame) return;
    
    // Stop GameplayScene and switch back to BootScene (or just stop)
    phaserGame.scene.start("BootScene"); // Go back to empty state
    
    // Hide Game Canvas
    gameContainer.style.display = "none";
    
    // Show UI
    uiContainer.classList.remove("hidden");
    
    const currentCoins = phaserGame.registry.get("coins");
    if (coinsDisplay) coinsDisplay.textContent = `${currentCoins} 🪙`;
};

// Logout
window.addEventListener("beforeunload", async () => {
    if (window.playerName) {
        try {
            await fetch("http://localhost:5000/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: window.playerName }),
            });
        } catch (err) {}
    }
});

