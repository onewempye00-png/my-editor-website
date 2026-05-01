const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { createToken } = require("../auth");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
        email,
        password: hashed
    });

    const token = createToken(user);

    res.json({ token, user });
});

// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No user" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });

    const token = createToken(user);

    res.json({ token, user });
});

module.exports = router;