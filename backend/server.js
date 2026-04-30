const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const sendEmail = require("./mailer");
const getPayments = () => JSON.parse(fs.readFileSync("./backend/payments.json"));
const savePayments = (data) => fs.writeFileSync("./backend/payments.json", JSON.stringify(data, null, 2));
const MAX_BUYERS = 100;

const app = express();
const SECRET = "supersecretkey";
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "../front-end")));

// 📂 Helpers
const getUsers = () => JSON.parse(fs.readFileSync("./backend/data.json"));
const saveUsers = (data) => fs.writeFileSync("./backend/data.json", JSON.stringify(data, null, 2));
const getAdmins = () => JSON.parse(fs.readFileSync("./backend/admin.json"));

// 🚀 REGISTER
app.post("/register", (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email required" });

    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "Already registered" });
    }

    users.push({
        email,
        date: new Date()
    });

    saveUsers(users);

    res.json({ message: "Registered successfully 🚀" });
});

// 🔐 LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const admins = getAdmins();

    const admin = admins.find(a => a.username === username && a.password === password);

    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });

    res.json({ token });
});

// 🔒 VERIFY TOKEN
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

// 👥 GET USERS
app.get("/users", verifyToken, (req, res) => {
    res.json(getUsers());
});

// 📊 STATS
app.get("/stats", verifyToken, (req, res) => {
    const users = getUsers();

    res.json({
        totalUsers: users.length
    });
});

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

    const MAX_BUYERS = 100;
    
    payments.push({
        email,
        payerName,
        date: new Date()
    });

    savePayments(payments);

    res.json({ message: "Payment saved" });
});

// DEFAULT ROUTE (FIXES "Cannot GET /")
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../front-end/index.html"));
});

// 💰 PAYPAL WEBHOOK (REAL PAYMENT CONFIRMATION)
app.post("/paypal-webhook", express.json(), async (req, res) => {
    const event = req.body;

    try {
        // ONLY PROCESS COMPLETED PAYMENTS
        if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {

            const email = event.resource?.payer?.email_address;

            if (!email) return res.sendStatus(400);

            const payments = getPayments();

            payments.push({
                email,
                status: "paid",
                date: new Date()
            });

            savePayments(payments);

            console.log("💰 New paid user:", email);
        }

        res.sendStatus(200);

    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});
// 🚫 SCARCITY CHECK
const payments = getPayments();

if (payments.length >= MAX_BUYERS) {
    return res.status(403).json({
        message: "Sold out — only 100 early access spots available"
    });
}

// 🚀 START SERVER
app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});
const PORT = process.env.PORT || 5000;