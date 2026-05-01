const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    isPaid: { type: Boolean, default: false },
    subscriptionId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);