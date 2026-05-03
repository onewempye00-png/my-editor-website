require("dotenv").config();
const admin = require("firebase-admin");
console.log("🔥 FIREBASE LOADING...");

function cleanPrivateKey(key) {
    if (!key) return null;
    return key.replace(/\\n/g, "\n");
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase ENV missing:");
    console.error({
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey
    });
    throw new Error("Firebase config failed");
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
});

module.exports = admin.firestore();
