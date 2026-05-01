const express = require("express");
const User = require("../models/User");
const { verifyToken } = require("../auth");

const router = express.Router();

// revenue dashboard
router.get("/revenue", verifyToken, async (req, res) => {

    const users = await User.find({ isPaid: true });

    res.json({
        totalSubscribers: users.length,
        revenue: users.length * 9.99
    });
});

module.exports = router;