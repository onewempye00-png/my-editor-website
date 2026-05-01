const jwt = require("jsonwebtoken");

const createToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ error: "No token" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = { createToken, verifyToken };