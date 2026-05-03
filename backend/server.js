require("dotenv").config();
const db = require("./firebaseAdmin");
const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const adminConfig = require("./adminConfig");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecretkey";

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// ROOT ROUTE
// ======================
app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "Backend running"
    });
});

// ======================
// FOLDERS
// ======================
const TOKENS_FOLDER = path.join(__dirname, "tokens");

if (!fs.existsSync(TOKENS_FOLDER)) {
    fs.mkdirSync(TOKENS_FOLDER);
}

// ======================
// SAFE JSON
// ======================
const readJSON = (file) => {
    try {
        if (!fs.existsSync(file)) return [];
        const data = fs.readFileSync(file, "utf-8");
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

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

    res.json({
        message: "Admin logged in",
        token
    });
});

// ======================
// VERIFY USER TOKEN
// ======================
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ message: "No token" });
    }

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

// ======================
// ADMIN MIDDLEWARE (FIXED)
// ======================
const isAdmin = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, SECRET);

        const isAllowed = adminConfig.admins.some(
            a => a.email === decoded.email
        );

        if (!isAllowed) {
            return res.status(403).json({ message: "Not admin" });
        }

        req.user = decoded;
        next();

    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

// ======================
// REGISTER
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
            createdAt: new Date()
        });

        res.json({ message: "Registered 🚀" });

    } catch {
        res.status(500).json({ message: "Server error" });
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

    } catch {
        res.status(500).json({ message: "Login error" });
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
// STATS (ADMIN ONLY)
// ======================
app.get("/stats", isAdmin, async (req, res) => {
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
// ADMIN USERS
// ======================
app.get("/admin/users", isAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection("users").get();

        const users = [];

        snapshot.forEach(doc => {
            users.push(doc.data());
        });

        res.json(users);

    } catch {
        res.status(500).json({ message: "Failed to load users" });
    }
});

// ======================
// REVENUE
// ======================
app.get("/revenue", isAdmin, (req, res) => {
    const file = path.join(__dirname, "payments.json");

    const payments = readJSON(file);

    res.json({
        totalSales: payments.length,
        revenue: payments.length * 19.99
    });
});

// ======================
// PAYPAL WEBHOOK
// ======================
app.post("/paypal-webhook", async (req, res) => {
    const event = req.body;

    try {
        if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {

            const email = event.resource?.subscriber?.email_address;
            const subscriptionId = event.resource?.id;

            if (!email) return res.sendStatus(400);

            await db.collection("users").doc(email).update({
                paid: true,
                subscriptionId
            });

            const token = createToken(email);

            const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");

            fs.writeFileSync(
                path.join(TOKENS_FOLDER, `${safeEmail}.json`),
                JSON.stringify({ token })
            );
        }

        res.sendStatus(200);

    } catch {
        res.sendStatus(500);
    }
});

// ======================
// GET TOKEN
// ======================
app.get("/get-token", (req, res) => {
    const { email } = req.query;

    try {
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");

        const filePath = path.join(TOKENS_FOLDER, `${safeEmail}.json`);

        const data = JSON.parse(fs.readFileSync(filePath));

        fs.unlinkSync(filePath);

        res.json(data);

    } catch {
        res.status(404).json({ message: "No token" });
    }
});

// ======================
// START SERVER
// ======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 SaaS backend running on port", PORT);
});