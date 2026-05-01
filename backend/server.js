const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
<<<<<<< HEAD
=======
<<<<<<< HEAD
const axios = require("axios");
const sendEmail = require("./mailer");
>>>>>>> 8dff081 (fix duplicate PORT error)
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecretkey";

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// ======================
// FILE PATHS
// ======================
const USERS_FILE = path.join(__dirname, "data.json");
const PAYMENTS_FILE = path.join(__dirname, "payments.json");
const TOKENS_FOLDER = path.join(__dirname, "tokens");

// 🔥 CREATE TOKENS FOLDER
if (!fs.existsSync(TOKENS_FOLDER)) {
    fs.mkdirSync(TOKENS_FOLDER);
}

// ======================
// SAFE JSON READER (IMPORTANT FIX)
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

const writeJSON = (file, data) =>
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ======================
// USERS
// ======================
const getUsers = () => readJSON(USERS_FILE);
const saveUsers = (data) => writeJSON(USERS_FILE, data);

// ======================
// PAYMENTS
// ======================
const getPayments = () => readJSON(PAYMENTS_FILE);
const savePayments = (data) => writeJSON(PAYMENTS_FILE, data);

// ======================
// JWT
// ======================
const createToken = (email) => {
    return jwt.sign({ email }, SECRET, { expiresIn: "7d" });
};

<<<<<<< HEAD
=======
// 🌐 ADDED RENDER BACKEND URL
const API_URL = "https://my-editor-website.onrender.com";

// ✅ FIXED PATHS
const getPayments = () => JSON.parse(fs.readFileSync("../payments.json"));
const savePayments = (data) => fs.writeFileSync("../payments.json", JSON.stringify(data, null, 2));

const MAX_BUYERS = 100;

const app = express();
const SECRET = "supersecretkey";

// ✅ PORT MUST BE BEFORE USE
const PORT = process.env.PORT || 5000;
=======
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = "supersecretkey";

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// ======================
// FILE PATHS
// ======================
const USERS_FILE = path.join(__dirname, "data.json");
const PAYMENTS_FILE = path.join(__dirname, "payments.json");
const TOKENS_FOLDER = path.join(__dirname, "tokens");

// 🔥 CREATE TOKENS FOLDER
if (!fs.existsSync(TOKENS_FOLDER)) {
    fs.mkdirSync(TOKENS_FOLDER);
}

// ======================
// SAFE JSON READER (IMPORTANT FIX)
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

const writeJSON = (file, data) =>
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ======================
// USERS
// ======================
const getUsers = () => readJSON(USERS_FILE);
const saveUsers = (data) => writeJSON(USERS_FILE, data);

// ======================
// PAYMENTS
// ======================
const getPayments = () => readJSON(PAYMENTS_FILE);
const savePayments = (data) => writeJSON(PAYMENTS_FILE, data);

// ======================
// JWT
// ======================
const createToken = (email) => {
    return jwt.sign({ email }, SECRET, { expiresIn: "7d" });
};

>>>>>>> 8dff081 (fix duplicate PORT error)
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "No token" });

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
// 👥 USERS
app.get("/users", verifyToken, (req, res) => {
    res.json(getUsers());
=======
>>>>>>> 8dff081 (fix duplicate PORT error)
// ======================
// REGISTER
// ======================
app.post("/register", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "Already registered" });
    }

    users.push({
        email,
        paid: false,
        createdAt: new Date()
    });

    saveUsers(users);

    res.json({ message: "Registered" });
<<<<<<< HEAD
=======
>>>>>>> f0bf249 (fix duplicate PORT error)
>>>>>>> 8dff081 (fix duplicate PORT error)
});

// ======================
// LOGIN
// ======================
app.post("/login", (req, res) => {
    const { email } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) return res.status(404).json({ message: "User not found" });

    const token = createToken(email);

    res.json({ token, paid: user.paid });
});

// ======================
// CHECK SUBSCRIPTION
// ======================
app.get("/check-subscription", (req, res) => {
    const { email } = req.query;

    const users = getUsers();
    const user = users.find(u => u.email === email);

    res.json({ paid: user?.paid || false });
});

// ======================
// STATS
// ======================
app.get("/stats", verifyToken, (req, res) => {
    const users = getUsers();

    res.json({
        totalUsers: users.length
    });
});

<<<<<<< HEAD
// ======================
// REVENUE DASHBOARD
// ======================
=======
<<<<<<< HEAD
// 💰 REVENUE (PUT IT HERE)
>>>>>>> 8dff081 (fix duplicate PORT error)
app.get("/revenue", verifyToken, (req, res) => {
    const payments = getPayments();

    res.json({
        totalSales: payments.length,
        revenue: payments.length * 19.99
    });
});

<<<<<<< HEAD
// ======================
// PAYPAL WEBHOOK
// ======================
app.post("/paypal-webhook", (req, res) => {
=======
// 📧 SEND EMAIL TO ALL USERS
app.post("/send-email", verifyToken, async (req, res) => {
    const { subject, message } = req.body;

    const users = getUsers();

    try {
        for (let user of users) {
            await sendEmail(user.email, subject, message);
        }

        res.json({ message: "Emails sent successfully 🚀" });

    } catch (err) {
        res.status(500).json({ message: "Error sending emails" });
    }
});

// 💰 SAVE PAYMENT
app.post("/save-payment", async (req, res) => {
    const { email, payerName } = req.body;

    if (!email) return res.status(400).json({ message: "Email required" });

    const payments = getPayments();

    // ✅ MOVED SCARCITY CHECK HERE (valid place)
    if (payments.length >= MAX_BUYERS) {
        return res.status(403).json({
            message: "Sold out — only 100 early access spots available"
        });
    }

    payments.push({
        email,
        payerName,
        date: new Date()
=======
// ======================
// REVENUE DASHBOARD
// ======================
app.get("/revenue", verifyToken, (req, res) => {
    const payments = getPayments();

    res.json({
        totalSales: payments.length,
        revenue: payments.length * 19.99
    });
});

<<<<<<< HEAD
// DEFAULT ROUTE
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../front-end/index.html"));
});

// 💰 PAYPAL WEBHOOK
const axios = require("axios");

app.post("/paypal-webhook", async (req, res) => {
>>>>>>> 8dff081 (fix duplicate PORT error)
    const event = req.body;

    try {
        if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {

            const email = event.resource?.subscriber?.email_address;
            const subscriptionId = event.resource?.id;

            const users = getUsers();

            const index = users.findIndex(u => u.email === email);

            if (index !== -1) {
                users[index].paid = true;
                users[index].subscriptionId = subscriptionId;

                saveUsers(users);

<<<<<<< HEAD
                const token = createToken(email);
=======
    // 🔥 CREATE JWT TOKEN
    const token = createToken(email);
=======
// ======================
// PAYPAL WEBHOOK
// ======================
app.post("/paypal-webhook", (req, res) => {
    const event = req.body;

    try {
        if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {

            const email = event.resource?.subscriber?.email_address;
            const subscriptionId = event.resource?.id;

            const users = getUsers();

            const index = users.findIndex(u => u.email === email);

            if (index !== -1) {
                users[index].paid = true;
                users[index].subscriptionId = subscriptionId;

                saveUsers(users);

                const token = createToken(email);

                const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");

                fs.writeFileSync(
                    path.join(TOKENS_FOLDER, `${safeEmail}.json`),
                    JSON.stringify({ token })
                );
            }
        }
>>>>>>> f0bf249 (fix duplicate PORT error)
>>>>>>> 8dff081 (fix duplicate PORT error)

                const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");

                fs.writeFileSync(
                    path.join(TOKENS_FOLDER, `${safeEmail}.json`),
                    JSON.stringify({ token })
                );
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

<<<<<<< HEAD
// ======================
// GET TOKEN (AUTO LOGIN)
// ======================
=======
<<<<<<< HEAD
// 🔍 CHECK IF USER IS PAID
>>>>>>> 8dff081 (fix duplicate PORT error)
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
=======
// ======================
// GET TOKEN (AUTO LOGIN)
// ======================
app.get("/get-token", (req, res) => {
    const { email } = req.query;
>>>>>>> f0bf249 (fix duplicate PORT error)

<<<<<<< HEAD
// ======================
// START SERVER (RENDER FIX)
// ======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 SaaS backend running on port", PORT);
=======
    try {
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");

        const filePath = path.join(TOKENS_FOLDER, `${safeEmail}.json`);

        const data = JSON.parse(fs.readFileSync(filePath));

        fs.unlinkSync(filePath);

        res.json(data);

    } catch {
        res.status(404).json({ message: "No token" });
    }
>>>>>>> 8dff081 (fix duplicate PORT error)
});

// ======================
// START SERVER (RENDER FIX)
// ======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 SaaS backend running on port", PORT);
});