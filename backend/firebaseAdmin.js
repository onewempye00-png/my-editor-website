const admin = require("firebase-admin");

// ======================
// 🔥 VALIDATE ENV
// ======================
const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY"
];

required.forEach(key => {
    if (!process.env[key]) {
        throw new Error(`❌ Missing Firebase env variable: ${key}`);
    }
});

// ======================
// 🔥 INIT FIREBASE
// ======================
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                .replace(/\\n/g, "\n")
                .replace(/"/g, "") // 🔥 CRITICAL FIX
        })
    });
}

// ======================
// 🔥 FIRESTORE
// ======================
const db = admin.firestore();

module.exports = db;
