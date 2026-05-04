require("dotenv").config();

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
// DEBUG
// ======================
console.log("🔥 ENV CHECK:", {
    project: process.env.FIREBASE_PROJECT_ID,
    email: process.env.FIREBASE_CLIENT_EMAIL,
    key: process.env.FIREBASE_PRIVATE_KEY ? "OK" : "MISSING"
});

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// FRONTEND
// ======================
const frontendPath = path.join(__dirname, "../front-end");
app.use(express.static(frontendPath));

// ======================
// TEST
// ======================
app.get("/api", (req, res) => {
    res.json({ status: "online" });
});

// ======================
// FIREBASE TEST
// ======================
app.get("/test-firebase", async (req, res) => {
    try {
        const snapshot = await db.collection("users").get();
        res.json({ success: true, count: snapshot.size });
    } catch (err) {
        console.log("🔥 FIREBASE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ======================
// TOKEN HELPER
// ======================
const createToken = (email) => {
    return jwt.sign({ email }, SECRET, { expiresIn: "7d" });
};

// ======================
// GOOGLE LOGIN (FIXED)
// ======================
app.post("/google-login", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Missing Google token" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload.email;

        const appToken = createToken(email);

        res.json({
            token: appToken,
            email
        });

    } catch (err) {
        console.log("🔥 GOOGLE LOGIN ERROR:", err);
        res.status(401).json({
            message: "Invalid Google token",
            error: err.message
        });
    }
});

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
// REGISTER (FIXED SAFE)
// ======================
app.post("/register", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email required" });
    }

    try {
        const userRef = db.collection("users").doc(email);
        const doc = await userRef.get();

        if (doc.exists) {
            return res.status(400).json({ message: "Already registered" });
        }

        await userRef.set({
            email,
            paid: false,
            createdAt: new Date().toISOString()
        });

        res.json({ message: "Registered 🚀" });

    } catch (err) {
        console.log("🔥 REGISTER ERROR:", err);

        res.status(500).json({
            message: "Firebase error",
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
        res.status(500).json({ message: err.message });
    }
});

// ======================
// CHECK SUBSCRIPTION
// ======================
app.get("/check-subscription", async (req, res) => {
    try {
        const { email } = req.query;

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
// FRONTEND ROUTES
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
