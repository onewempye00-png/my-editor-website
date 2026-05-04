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
// EMAIL SETUP
// ======================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// ======================
const verificationCodes = {};
// ======================

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, "../front-end");
app.use(express.static(frontendPath));

// ======================
const createToken = (email) =>
    jwt.sign({ email }, SECRET, { expiresIn: "7d" });

const safeEmail = (email) =>
    email.replace(/\./g, "_").replace(/#/g, "_").replace(/\$/g, "_");

// ======================
// TEST
// ======================
app.get("/api", (req, res) => {
    res.json({ status: "online" });
});

// ======================
// REGISTER (WAITLIST ONLY)
// ======================
app.post("/register", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ message: "Email required" });

        const ref = db.ref("users/" + safeEmail(email));
        const snap = await ref.get();

        if (snap.exists()) {
            return res.json({ message: "Already registered" });
        }

        await ref.set({
            email,
            verified: false,
            paid: false,
            createdAt: Date.now()
        });

        res.json({ message: "Registered (check email for code)" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ======================
// SEND CODE
// ======================
app.post("/send-code", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ message: "Email required" });

        const code = Math.floor(100000 + Math.random() * 900000);

        verificationCodes[email] = {
            code,
            expires: Date.now() + 10 * 60 * 1000
        };

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Your Waitlist Code",
            html: `<h2>Your code: ${code}</h2>`
        });

        res.json({ message: "Code sent" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Email error" });
    }
});

// ======================
// VERIFY CODE
// ======================
app.post("/verify-code", async (req, res) => {
    try {
        const { email, code } = req.body;

        const record = verificationCodes[email];

        if (!record) return res.status(400).json({ message: "No code" });

        if (Date.now() > record.expires)
            return res.status(400).json({ message: "Expired" });

        if (record.code != code)
            return res.status(400).json({ message: "Wrong code" });

        const ref = db.ref("users/" + safeEmail(email));

        await ref.update({
            verified: true
        });

        delete verificationCodes[email];

        res.json({
            message: "Verified",
            token: createToken(email)
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Verify error" });
    }
});

// ======================
// GOOGLE LOGIN
// ======================
app.post("/google-login", async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const email = ticket.getPayload().email;

        const ref = db.ref("users/" + safeEmail(email));
        const snap = await ref.get();

        if (!snap.exists()) {
            await ref.set({
                email,
                verified: true,
                paid: false,
                createdAt: Date.now()
            });
        }

        res.json({
            token: createToken(email),
            email
        });

    } catch (err) {
        console.log(err);
        res.status(401).json({ message: "Google login failed" });
    }
});

// ======================
// LOGIN
// ======================
app.post("/login", async (req, res) => {
    try {
        const { email } = req.body;

        const snap = await db.ref("users/" + safeEmail(email)).get();

        if (!snap.exists())
            return res.status(404).json({ message: "User not found" });

        res.json({
            token: createToken(email),
            paid: snap.val().paid
        });

    } catch (err) {
        res.status(500).json({ message: "Login error" });
    }
});

// ======================
// STATS
// ======================
app.get("/stats", async (req, res) => {
    try {
        const snap = await db.ref("users").get();
        const data = snap.val() || {};

        res.json({
            totalUsers: Object.keys(data).length
        });

    } catch {
        res.json({ totalUsers: 0 });
    }
});

// ======================
// FRONTEND
// ======================
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ======================
app.listen(PORT, () => {
    console.log("🔥 Server running on", PORT);
});
