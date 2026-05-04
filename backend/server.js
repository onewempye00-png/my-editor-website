require("dotenv").config();

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const path = require("path");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const db = require("./firebaseAdmin");
const adminConfig = require("./adminConfig");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecretkey";

// ======================
// EMAIL
// ======================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ======================
// TEMP CODE STORAGE
// ======================
const verificationCodes = {}; // { email: { code, expires } }

// ======================
// DEBUG
// ======================
console.log("🔥 ENV CHECK:", {
    project: process.env.FIREBASE_PROJECT_ID,
    email: process.env.FIREBASE_CLIENT_EMAIL,
    dbURL: process.env.FIREBASE_DATABASE_URL ? "OK" : "MISSING"
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
// HELPERS
// ======================
const createToken = (email) => {
    return jwt.sign({ email }, SECRET, { expiresIn: "7d" });
};

const safeEmail = (email) => email.replace(/\./g, "_");

// ======================
// TEST API
// ======================
app.get("/api", (req, res) => {
    res.json({ status: "online" });
});

// ======================
// FIREBASE TEST (REALTIME)
// ======================
app.get("/test-firebase", async (req, res) => {
    try {
        const snapshot = await db.ref("users").get();
        const users = snapshot.val() || {};

        res.json({
            success: true,
            count: Object.keys(users).length
        });

    } catch (err) {
        console.log("🔥 FIREBASE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ======================
// GOOGLE LOGIN (AUTO REGISTER)
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

        const userRef = db.ref("users/" + safeEmail(email));
        const snapshot = await userRef.get();

        if (!snapshot.exists()) {
            await userRef.set({
                email,
                paid: false,
                createdAt: new Date().toISOString()
            });
        }

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
// SEND VERIFICATION CODE
// ======================
app.post("/send-code", async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email required" });
    }

    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        verificationCodes[email] = {
            code,
            expires: Date.now() + 10 * 60 * 1000
        };

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Waitlist Code 🚀",
            html: `<h2>Your code: ${code}</h2><p>Expires in 10 minutes</p>`
        });

        res.json({ message: "Code sent 📧" });

    } catch (err) {
        console.log("EMAIL ERROR:", err);
        res.status(500).json({ message: "Failed to send email" });
    }
});

// ======================
// VERIFY CODE + REGISTER
// ======================
app.post("/verify-code", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: "Missing data" });
    }

    const record = verificationCodes[email];

    if (!record) {
        return res.status(400).json({ message: "No code found" });
    }

    if (Date.now() > record.expires) {
        delete verificationCodes[email];
        return res.status(400).json({ message: "Code expired" });
    }

    if (record.code !== code) {
        return res.status(400).json({ message: "Invalid code" });
    }

    try {
        const userRef = db.ref("users/" + safeEmail(email));
        const snapshot = await userRef.get();

        if (!snapshot.exists()) {
            await userRef.set({
                email,
                paid: false,
                createdAt: new Date().toISOString()
            });
        }

        delete verificationCodes[email];

        const token = createToken(email);

        res.json({
            message: "Verified ✅",
            token
        });

    } catch (err) {
        console.log("VERIFY ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================
// LOGIN
// ======================
app.post("/login", async (req, res) => {
    try {
        const { email } = req.body;

        const snapshot = await db.ref("users/" + safeEmail(email)).get();

        if (!snapshot.exists()) {
            return res.status(404).json({ message: "User not found" });
        }

        const data = snapshot.val();
        const token = createToken(email);

        res.json({
            token,
            paid: data.paid
        });

    } catch (err) {
        console.log("🔥 LOGIN ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// ======================
// CHECK SUBSCRIPTION
// ======================
app.get("/check-subscription", async (req, res) => {
    try {
        const { email } = req.query;

        const snapshot = await db.ref("users/" + safeEmail(email)).get();

        if (!snapshot.exists()) {
            return res.json({ paid: false });
        }

        res.json({ paid: snapshot.val().paid });

    } catch {
        res.json({ paid: false });
    }
});

// ======================
// STATS
// ======================
app.get("/stats", async (req, res) => {
    try {
        const snapshot = await db.ref("users").get();
        const users = snapshot.val() || {};

        res.json({
            totalUsers: Object.keys(users).length
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
// GLOBAL ERROR
// ======================
app.use((err, req, res, next) => {
    console.log("🔥 GLOBAL ERROR:", err);
    res.status(500).json({
        message: "Server crashed",
        error: err.message
    });
});

// ======================
// START SERVER
// ======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 Server running on port", PORT);
});
