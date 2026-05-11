require("dotenv").config();

const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");
const admin = require("firebase-admin");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

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
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// ======================
// FIREBASE INIT
// ======================
if (!admin.apps.length) {

    if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
    ) {
        console.error("❌ Missing Firebase environment variables");
        process.exit(1);
    }

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
// RATE LIMITING
// ======================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5
});

// ======================
// MIDDLEWARE
// ======================
app.use(cors());

app.use(express.json({
    limit: "1mb"
}));

app.use(express.urlencoded({
    extended: true
}));

app.use(apiLimiter);

app.use(express.static(
    path.join(__dirname, "../front-end")
));

// ======================
// JSON ERROR HANDLER
// ======================
app.use((err, req, res, next) => {

    if (err instanceof SyntaxError) {
        return res.status(400).json({
            message: "Invalid JSON sent to server"
        });
    }

    next();
});

// ======================
// TEST ROUTE
// ======================
app.post("/test-json", (req, res) => {

    res.json({
        received: req.body
    });
});

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
// HELPERS
// ======================
const safeEmail = (email) =>
    email
        .replace(/\./g, "_")
        .replace(/#/g, "_")
        .replace(/\$/g, "_");

const createToken = (email) =>
    jwt.sign(
        { email },
        SECRET,
        { expiresIn: "7d" }
    );

// ======================
// ADMIN CONFIG
// ======================
const ADMIN_EMAIL_1 = "myeditor.dev@gmail.com";

const ADMIN_EMAIL_2 = "onewempye00@gmail.com";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "RizzDS12";

// ======================
// VERIFY ADMIN
// ======================
const verifyAdmin = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No token"
        });
    }

    try {

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        const decoded = jwt.verify(token, SECRET);

        if (!decoded.admin) {
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        req.admin = decoded;

        next();

    } catch (err) {

        return res.status(403).json({
            message: "Unauthorized"
        });
    }
};

// ======================
// ROOT
// ======================
app.get("/api", (req, res) => {

    res.json({
        status: "online"
    });
});

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../front-end", "index.html")
    );
});

// ======================
// REGISTER USER
// ======================
app.post("/register", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email required"
            });
        }

        const ref = db.ref(
            "users/" + safeEmail(email)
        );

        const snap = await ref.get();

        if (snap.exists()) {
            return res.json({
                message: "Already registered"
            });
        }

        await ref.set({
            email,
            verified: false,
            banned: false,
            paid: false,
            createdAt: Date.now()
        });

        // 🔥 INCREMENT WAITLIST
        const statsRef = db.ref("stats/waitingCount");

        const current =
            (await statsRef.get()).val() || 0;

        await statsRef.set(current + 1);

        res.json({
            message: "Registered"
        });

    } catch (err) {

        console.log("REGISTER ERROR:", err);

        res.status(500).json({
            message: "Register failed"
        });
    }
});

// ======================
// SEND OTP
// ======================
app.post("/send-code", otpLimiter, async (req, res) => {

    try {

        console.log("SEND CODE HIT");

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email required"
            });
        }

        const code =
            Math.floor(
                100000 + Math.random() * 900000
            ).toString();

        await db.ref(
            "otps/" + safeEmail(email)
        ).set({
            code,
            expires: Date.now() + 10 * 60 * 1000
        });

        console.log("OTP SAVED");

        // 🔥 TEMPORARY EMAIL TEST
        console.log("OTP CODE:", code);

        return res.json({
            message: "OTP generated"
        });

    } catch (err) {

        console.log("SEND CODE ERROR:", err);

        return res.status(500).json({
            message: "Send code failed"
        });
    }
});

// ======================
// VERIFY OTP
// ======================
app.post("/verify-code", async (req, res) => {

    try {

        const { email, code } = req.body;

        const ref = db.ref(
            "otps/" + safeEmail(email)
        );

        const snap = await ref.get();

        if (!snap.exists()) {
            return res.status(400).json({
                message: "No OTP"
            });
        }

        const data = snap.val();

        if (Date.now() > data.expires) {
            return res.status(400).json({
                message: "Expired"
            });
        }

        if (data.code !== code) {
            return res.status(400).json({
                message: "Wrong code"
            });
        }

        await db.ref(
            "users/" + safeEmail(email)
        ).update({
            verified: true
        });

        await ref.remove();

        res.json({
            message: "Verified",
            token: createToken(email)
        });

    } catch (err) {

        console.log("VERIFY ERROR:", err);

        res.status(500).json({
            message: "Verify error"
        });
    }
});

// ======================
// GOOGLE LOGIN
// ======================
app.post("/google-login", async (req, res) => {

    try {

        const { token } = req.body;

        const ticket =
            await googleClient.verifyIdToken({
                idToken: token,
                audience:
                    process.env.GOOGLE_CLIENT_ID
            });

        const email =
            ticket.getPayload().email;

        const ref = db.ref(
            "users/" + safeEmail(email)
        );

        const snap = await ref.get();

        if (!snap.exists()) {

            await ref.set({
                email,
                verified: true,
                banned: false,
                paid: false,
                createdAt: Date.now()
            });
        }

        res.json({
            token: createToken(email),
            email
        });

    } catch (err) {

        console.log("GOOGLE LOGIN ERROR:", err);

        res.status(401).json({
            message: "Google login failed"
        });
    }
});

// ======================
// ADMIN LOGIN
// ======================
app.post("/admin/login", (req, res) => {

    const { email, password } = req.body;

    if (
        (
            email === ADMIN_EMAIL_1 ||
            email === ADMIN_EMAIL_2
        ) &&
        password === process.env.ADMIN_PASSWORD
    ) {

        const token = jwt.sign(
            { admin: true },
            SECRET,
            { expiresIn: "1d" }
        );

        return res.json({
            token
        });
    }

    res.status(401).json({
        message: "Invalid admin"
    });
});

// ======================
// ADMIN USERS
// ======================
app.get(
    "/admin/users",
    verifyAdmin,
    async (req, res) => {

        const snap = await db.ref("users").get();

        res.json(snap.val() || {});
    }
);

// ======================
// DELETE USER
// ======================
app.delete(
    "/admin/user/:email",
    verifyAdmin,
    async (req, res) => {

        const email = req.params.email;

        await db.ref(
            "users/" + safeEmail(email)
        ).remove();

        await db.ref(
            "otps/" + safeEmail(email)
        ).remove();

        res.json({
            message: "User deleted"
        });
    }
);

// ======================
// BAN USER
// ======================
app.post(
    "/admin/ban",
    verifyAdmin,
    async (req, res) => {

        const { email } = req.body;

        await db.ref(
            "users/" + safeEmail(email)
        ).update({
            banned: true
        });

        res.json({
            message: "User banned"
        });
    }
);

// ======================
// STATS
// ======================
app.get(
    "/admin/stats",
    verifyAdmin,
    async (req, res) => {

        const snap = await db.ref("users").get();

        const users = snap.val() || {};

        let verified = 0;
        let banned = 0;

        Object.values(users).forEach(u => {

            if (u.verified) verified++;

            if (u.banned) banned++;
        });

        res.json({
            totalUsers: Object.keys(users).length,
            verified,
            banned
        });
    }
);

// ======================
// EMAIL EXPLOSION
// ======================
const sendLaunchEmails = async () => {

    const snap = await db.ref("users").get();

    const users = snap.val() || {};

    const emails = Object.values(users)
        .map(u => u.email)
        .filter(Boolean);

    for (const email of emails) {

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "🚀 We are LIVE!",
            html: `
                <h1>The app is now LIVE!</h1>
                <p>Click here to access the platform.</p>
            `
        });
    }
};

// ======================
// LAUNCH CHECKER
// ======================
setInterval(async () => {

    try {

        const snap =
            await db.ref("stats").get();

        const stats = snap.val();

        if (!stats) return;

        const now = Date.now();

        if (
            !stats.launched &&
            now >= stats.launchTime
        ) {

            console.log(
                "🚀 LAUNCH TRIGGERED"
            );

            await db.ref("stats").update({
                launched: true
            });

            await sendLaunchEmails();

            console.log(
                "📧 Email blast complete"
            );
        }

    } catch (err) {

        console.log(
            "LAUNCH CHECK ERROR:",
            err
        );
    }

}, 10000);

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {

    console.log(
        "🔥 Server running on",
        PORT
    );
});
