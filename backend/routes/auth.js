const express = require("express");
const jwt = require("jsonwebtoken");
const adminConfig = require("../adminConfig");

const router = express.Router();
const SECRET = "supersecretkey";

// ======================
// ADMIN LOGIN (REAL)
// ======================
router.post("/admin-login", (req, res) => {
    const { email, password } = req.body;

    const admin = adminConfig.admins.find(
        a => a.email === email && a.password === password
    );

    if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { email, role: "admin" },
        SECRET,
        { expiresIn: "7d" }
    );

    res.json({ token, email });
});

module.exports = router;