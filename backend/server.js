require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// === MongoDB Connection ===
const client = new MongoClient(process.env.MONGO_URI);
let usersCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("EscapeRealmDB"); // database name
        usersCollection = db.collection("users"); // collection name
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ DB connection error:", err);
    }
}
connectDB();

// === Signup API ===
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    // check if user already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // insert new user with default status offline
    await usersCollection.insertOne({
        username,
        password,
        status: "offline", // default status when first created
        lastLogin: null,   // no login yet
        loginHistory: [],  // empty login history
        coins: 0           // ✅ initialize coins field with 0
    });

    // ✅ also return coins + username so frontend can use immediately
    res.status(201).json({ message: "User created successfully", username, coins: 0 });
});

// === Login API ===
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const user = await usersCollection.findOne({ username });

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const now = new Date();

    // update user status and add login record
    await usersCollection.updateOne(
        { username },
        {
            $set: { lastLogin: now, status: "online" }, // mark user online
            $push: { loginHistory: { date: now, status: "online" } } // keep track of logins
        }
    );

    // ✅ return username + coins so frontend can display balance immediately
    res.json({ 
        message: "Login successful", 
        username: user.username, 
        coins: user.coins !== undefined ? user.coins : 0 // ✅ make sure coins always exist
    });
});

// === Logout API ===
app.post("/logout", async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: "Missing username" });
    }

    const now = new Date();

    // set user offline and log it
    await usersCollection.updateOne(
        { username },
        {
            $set: { status: "offline" },
            $push: { loginHistory: { date: now, status: "offline" } }
        }
    );

    res.json({ message: "User is now offline" });
});

// === Update Coins API ===
// This will be called whenever player earns/spends coins in the game
app.post("/update-coins", async (req, res) => {
    const { username, coins } = req.body;

    if (!username || coins === undefined) {
        return res.status(400).json({ message: "Missing username or coins" });
    }

    // ✅ ensure coins is always stored as a number
    const numericCoins = Number(coins);

    // ✅ update user's coin balance in DB
    const result = await usersCollection.updateOne(
        { username },
        { $set: { coins: numericCoins } }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Coins updated successfully", username, coins: numericCoins });
});

// === Get Coins API ===
// Useful if you want to fetch only coins (optional)
app.get("/coins/:username", async (req, res) => {
    const { username } = req.params;

    const user = await usersCollection.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({ username, coins: user.coins !== undefined ? user.coins : 0 });
});

// === Start Server ===
app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
