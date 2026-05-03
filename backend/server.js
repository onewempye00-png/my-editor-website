require("dotenv").config();
console.log("PROJECT:", process.env.FIREBASE_PROJECT_ID);

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
// ✅ API routes FIRST
app.post("/register", ...)
app.post("/login", ...)
app.get("/stats", ...)
app.get("/check-subscription", ...)

});
// ======================
// API TEST ROUTE
// ======================
app.get("/api", (req, res) => {
    res.json({
        status: "online",
        message: "Backend running"
    });
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

    console.log("➡️ REGISTER REQUEST:", email);

    if (!email) {
        return res.status(400).json({ message: "Email required" });
    }

    try {
        console.log("🔥 CONNECTING TO FIREBASE...");

        const userRef = db.collection("users").doc(email);

        console.log("🔥 GETTING USER DOC...");
        const doc = await userRef.get();

        console.log("🔥 DOC EXISTS:", doc.exists);

        if (doc.exists) {
            return res.status(400).json({ message: "Already registered" });
        }

        console.log("🔥 CREATING USER...");

        await userRef.set({
            email,
            paid: false,
            createdAt: new Date().toISOString()
        });

        console.log("✅ USER CREATED");

        res.json({ message: "Registered 🚀" });

    } catch (err) {
        console.log("❌ FULL FIREBASE ERROR:");
        console.log(err);

        res.status(500).json({
            message: "Server error",
            error: err.message
        });
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
        console.log("🔥 LOGIN ERROR:", err);
        res.status(500).json({
            message: "Login error",
            error: err.message
        });
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

    } catch {
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
// FRONTEND ROUTING FIX
// ======================
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
    
// ======================
// START SERVER
// ======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 SaaS backend running on port", PORT);
});
