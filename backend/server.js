import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import rateLimit from "express-rate-limit";
import admin from "firebase-admin";
import cors from "cors";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ======================
// APP INIT
// ======================
const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || "dev_secret";

// ======================
// GOOGLE AUTH
// ======================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ======================
// FIREBASE INIT
// ======================
if (!admin.apps.length) {

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

// ======================
// CONSTANTS (REAL SOURCE OF TRUTH)
// ======================
const EARLY_ACCESS_TOTAL = 5000;

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================
// SAFE INIT (ENSURES FIREBASE DOESN'T BREAK)
// ======================
async function ensureStats() {
    const ref = db.ref("stats");

    const snap = await ref.get();
    const data = snap.val();

    if (!data?.waitingCount) {
        await ref.update({
            waitingCount: 0
        });
    }
}

ensureStats();

// ======================
// EARLY ACCESS REAL-TIME STATS
// ======================
app.get("/early-access-stats", async (req, res) => {

    const snap = await db.ref("stats/waitingCount").get();
    const used = snap.val() || 0;

    res.json({
        total: EARLY_ACCESS_TOTAL,
        remaining: Math.max(EARLY_ACCESS_TOTAL - used, 0),
        used
    });
});

// ======================
// SAFE INCREMENT (NO RACE CONDITIONS)
// ======================
async function incrementWaitlist() {

    const ref = db.ref("stats/waitingCount");

    await ref.transaction(current => {
        return (current || 0) + 1;
    });
}

// ======================
// REGISTER USER (REAL-TIME SAFE)
// ======================
app.post("/register", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        const userRef = db.ref("users/" + email.replace(/\./g, "_"));
        const snap = await userRef.get();

        if (snap.exists()) {
            return res.json({ message: "Already registered" });
        }

        await userRef.set({
            email,
            verified: false,
            createdAt: Date.now()
        });

        // 🔥 REAL TIME INCREMENT
        await incrementWaitlist();

        res.json({ message: "Registered" });

    } catch (err) {
        res.status(500).json({ message: "Register failed" });
    }
});

// ======================
// LAUNCH TIME (GLOBAL SYNC)
// ======================
app.get("/launch-time", async (req, res) => {

    const snap = await db.ref("stats/launchTime").get();

    res.json({
        launchTime: snap.val() || Date.now() + 1000 * 60 * 60 * 24 * 180
    });
});

// ======================
// LAUNCH CHECKER (CLEAN)
// ======================
setInterval(async () => {

    const snap = await db.ref("stats").get();
    const stats = snap.val();

    if (!stats) return;

    const now = Date.now();

    if (!stats.launched && now >= stats.launchTime) {

        await db.ref("stats").update({
            launched: true
        });

        console.log("🚀 LAUNCH TRIGGERED");
    }

}, 10000);

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
    console.log("🔥 Server running on", PORT);
});
