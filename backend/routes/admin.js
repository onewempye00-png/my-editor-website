const express = require("express");
const db = require("../firebaseAdmin");
const { verifyToken } = require("../auth");

const router = express.Router();

// ======================
// REVENUE DASHBOARD (FIREBASE)
// ======================
router.get("/revenue", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("users")
            .where("paid", "==", true)
            .get();

        const totalSubscribers = snapshot.size;
        const revenue = totalSubscribers * 9.99;

        res.json({
            totalSubscribers,
            revenue
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;