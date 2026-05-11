const API_URL = "";

// ======================
// SAFE FETCH (FIXED DEBUG + RELIABLE ERROR HANDLING)
// ======================
async function safeFetch(url, options = {}) {
const res = await fetch(url, options);

const text = await res.text();

let data;
try {
    data = JSON.parse(text);
} catch {
    console.log("NON-JSON RESPONSE:", text);
    throw new Error("Server returned invalid response");
}

if (!res.ok) {
    console.log("ERROR:", data);
    throw new Error(data?.message || "Request failed");
}

return data;
}

// ======================
// REGISTER + SEND OTP (FIXED FLOW)
// ======================
const form = document.getElementById("preRegForm");

form?.addEventListener("submit", async (e) => {
e.preventDefault();

const email = form.querySelector("input").value.trim();
const message = document.getElementById("message");

try {
    message.innerText = "Sending OTP...";

    await safeFetch(`${API_URL}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    localStorage.setItem("email", email);

    document.getElementById("otpBox").style.display = "block";

    message.innerText = "Check your email 📧";

} catch (err) {
    message.innerText = err.message;
}
});

// ======================
// VERIFY OTP
// ======================
async function verifyCode() {
const email = localStorage.getItem("email");
const code = document.getElementById("codeInput").value.trim();
const message = document.getElementById("message");

try {
    message.innerText = "Verifying...";

    const data = await safeFetch(`${API_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
    });

    localStorage.setItem("token", data.token);

    message.innerText = "Verified 🚀";

    init();

} catch (err) {
    message.innerText = err.message;
}
}

// ======================
// GOOGLE LOGIN (UNCHANGED)
// ======================
window.handleGoogleLogin = async function (response) {
const message = document.getElementById("message");

try {
    const data = await safeFetch(`${API_URL}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential })
    });

    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);

    message.innerText = "Google login success ✅";

    init();

} catch (err) {
    console.error(err);
    message.innerText = "Google login failed";
}
};

// ======================
// COUNTDOWN (UNCHANGED - BASE)
// ======================
const launchDate = new Date();
launchDate.setMonth(launchDate.getMonth() + 6);

// 🔥 NEW: Firebase synced countdown base time
let serverLaunchTime = null;

// ======================
// 🔥 LIVE FIREBASE COUNTDOWN SYNC (ADDED)
// ======================
async function syncLaunchTime() {
    try {
        const data = await safeFetch(`${API_URL}/early-access`);
        serverLaunchTime = Date.now() + (data.remaining * 1000); // placeholder sync logic
    } catch (err) {
        console.log("Countdown sync failed, using fallback");
    }
}

syncLaunchTime();

// ======================
// UPDATED COUNTDOWN (NOW SYNC READY)
// ======================
setInterval(() => {
const el = document.getElementById("countdown");
if (!el) return;

// fallback if server sync not ready
const target = serverLaunchTime || launchDate.getTime();

const diff = target - Date.now();

if (diff <= 0) {
    el.innerText = "LIVE";
    return;
}

const d = Math.floor(diff / 86400000);
const h = Math.floor((diff / 3600000) % 24);
const m = Math.floor((diff / 60000) % 60);
const s = Math.floor((diff / 1000) % 60);

el.innerText = `${d}d ${h}h ${m}m ${s}s`;

}, 1000);

// ======================
// INIT UI (UNCHANGED)
// ======================
function init() {
const email = localStorage.getItem("email");
const editor = document.getElementById("editor");
const paywall = document.getElementById("paywall");

if (!editor || !paywall) return;

if (!email) {
    paywall.style.display = "block";
    editor.style.display = "none";
    return;
}

editor.style.display = "block";
paywall.style.display = "none";
}

// ======================
// 🔥 FIREBASE EARLY ACCESS COUNTER (ADDED)
// ======================
async function loadEarlyAccessCounter() {
    try {
        const data = await safeFetch(`${API_URL}/early-access`);

        const el = document.getElementById("earlyCounter");

        if (el) {
            el.innerText = `${data.used} / 5000`;
        }

    } catch (err) {
        console.log("Counter failed");
    }
}

// auto-refresh counter every 5 seconds (real-time feel)
setInterval(loadEarlyAccessCounter, 5000);
loadEarlyAccessCounter();

init();
