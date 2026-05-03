const admin = require("firebase-admin");

// ======================
// SAFE ENV VALIDATION
// ======================
const requiredEnv = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`❌ Missing Firebase env variable: ${key}`);
    }
}

// ======================
// SERVICE ACCOUNT
// ======================
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// ======================
// INIT FIREBASE (SAFE GUARD)
// ======================
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

console.log("🔥 Firebase Admin connected successfully");

module.exports = db;