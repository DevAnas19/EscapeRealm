require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();

// ================== MIDDLEWARE ==================
app.use(express.json());

// ✅ CORS (safe for now, can restrict later)
app.use(cors({
    origin: "*"
}));

// ================== MONGODB CONNECTION ==================
const client = new MongoClient(process.env.MONGO_URI);
let usersCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("EscapeRealmDB");
        usersCollection = db.collection("users");
        console.log("✅ Connected to MongoDB Atlas");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
    }
}

connectDB();

// ================== HELPER ==================
function checkDB(res) {
    if (!usersCollection) {
        res.status(503).json({ message: "Database not ready" });
        return false;
    }
    return true;
}

// ================== SIGNUP ==================
app.post("/signup", async (req, res) => {
    if (!checkDB(res)) return;

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    await usersCollection.insertOne({
        username,
        password,           // ⚠️ plain text (ok for now)
        status: "offline",
        lastLogin: null,
        loginHistory: [],
        coins: 0
    });

    res.status(201).json({
        message: "User created successfully",
        username,
        coins: 0
    });
});

// ================== LOGIN ==================
app.post("/login", async (req, res) => {
    if (!checkDB(res)) return;

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const user = await usersCollection.findOne({ username });

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const now = new Date();

    await usersCollection.updateOne(
        { username },
        {
            $set: { status: "online", lastLogin: now },
            $push: { loginHistory: { date: now, status: "online" } }
        }
    );

    res.json({
        message: "Login successful",
        username: user.username,
        coins: user.coins ?? 0
    });
});

// ================== LOGOUT ==================
app.post("/logout", async (req, res) => {
    if (!checkDB(res)) return;

    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: "Missing username" });
    }

    const now = new Date();

    await usersCollection.updateOne(
        { username },
        {
            $set: { status: "offline" },
            $push: { loginHistory: { date: now, status: "offline" } }
        }
    );

    res.json({ message: "User logged out" });
});

// ================== UPDATE COINS ==================
app.post("/update-coins", async (req, res) => {
    if (!checkDB(res)) return;

    const { username, coins } = req.body;

    if (!username || coins === undefined) {
        return res.status(400).json({ message: "Missing username or coins" });
    }

    const numericCoins = Number(coins);

    const result = await usersCollection.updateOne(
        { username },
        { $set: { coins: numericCoins } }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({
        message: "Coins updated successfully",
        username,
        coins: numericCoins
    });
});

// ================== GET COINS ==================
app.get("/coins/:username", async (req, res) => {
    if (!checkDB(res)) return;

    const { username } = req.params;

    const user = await usersCollection.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({
        username,
        coins: user.coins ?? 0
    });
});

// ================== HEALTH CHECK (OPTIONAL) ==================
app.get("/", (req, res) => {
    res.send("🚀 EscapeRealm API is running");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
