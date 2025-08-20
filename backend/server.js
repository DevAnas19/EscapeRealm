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

    // insert new user
    await usersCollection.insertOne({ username, password });
    res.status(201).json({ message: "User created successfully" });
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

    res.json({ message: "Login successful" });
});

// === Start Server ===
app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
