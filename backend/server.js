require("dotenv").config();

const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const db = require("./firebaseAdmin");
const adminConfig = require("./adminConfig");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecretkey";

// ======================
// FRONTEND PATH
// ======================
const frontendPath = path.join(__dirname, "../front-end");

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// ======================
// TEST API
// ======================
app.get("/api", (req, res) => {
    res.json({ status: "online" });
});

// ======================
// TOKENS FOLDER
// ======================
const TOKENS_FOLDER = path.join(__dirname, "tokens");
if (!fs.existsSync(TOKENS_FOLDER)) {
    fs.mkdirSync(TOKENS_FOLDER);
}

// ======================
// JWT
// ======================
const createToken = (email) => {
    return jwt.sign({ email }, SECRET, { expiresIn: "7d" });
};

// ======================
// ADMIN LOGIN
// ======================
app.post("/admin-login", (req, res) => {
    const { email, password } = req.body;

    const admin = adminConfig.admins.find(
        a => a.email === email && a.password === password
    );

    if (!admin) {
        return res.status(401).json({ message: "Invalid admin login" });
    }

    const token = jwt.sign(
        { email, role: "admin" },
        SECRET,
        { expiresIn: "7d" }
    );

    res.json({ token });
});

// ======================
// REGISTER
// ======================
app.post("/register", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email required" });
    }

    try {
        const doc = await db.collection("users").doc(email).get();

        if (doc.exists) {
            return res.status(400).json({ message: "Already registered" });
        }

        await db.collection("users").doc(email).set({
            email,
            paid: false,
            createdAt: new Date().toISOString()
        });

        res.json({ message: "Registered 🚀" });

    } catch (err) {
        console.log("REGISTER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ======================
// LOGIN
// ======================
app.post("/login", async (req, res) => {
    const { email } = req.body;

    try {
        const doc = await db.collection("users").doc(email).get();

        if (!doc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = createToken(email);

        res.json({
            token,
            paid: doc.data().paid
        });

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ======================
// CHECK SUBSCRIPTION
// ======================
app.get("/check-subscription", async (req, res) => {
    const { email } = req.query;

    try {
        const doc = await db.collection("users").doc(email).get();

        if (!doc.exists) {
            return res.json({ paid: false });
        }

        res.json({ paid: doc.data().paid });

    } catch (err) {
        res.json({ paid: false });
    }
});

// ======================
// STATS
// ======================
app.get("/stats", async (req, res) => {
    try {
        const snapshot = await db.collection("users").get();

        res.json({
            totalUsers: snapshot.size
        });

    } catch {
        res.json({ totalUsers: 0 });
    }
});

// ======================
// FRONTEND ROUTES (VERY LAST)
// ======================
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ======================
// START SERVER
// ======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 Server running on port", PORT);
});
