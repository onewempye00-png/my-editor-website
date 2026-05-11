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
// COUNTDOWN (UNCHANGED)  
// ======================  
const launchDate = new Date();  
launchDate.setMonth(launchDate.getMonth() + 6);  
  
setInterval(() => {  
    const el = document.getElementById("countdown");  
    if (!el) return;  
  
    const diff = launchDate - Date.now();  
  
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
  
init();  

// =====================================================
// 🚀 ADDED: PERSISTENT LIVE TIMER (DOES NOT RESET)
// =====================================================
(function persistentLiveTimer() {
    let startTime = localStorage.getItem("live_timer_start");

    if (!startTime) {
        startTime = Date.now();
        localStorage.setItem("live_timer_start", startTime);
    }

    function updateTimer() {
        const el = document.getElementById("liveTimer");
        if (!el) return;

        const now = Date.now();
        const diff = now - parseInt(startTime);

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        el.innerText = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }

    setInterval(updateTimer, 1000);
})();

// =====================================================
// 🚀 ADDED: LIVE EARLY ACCESS COUNTER (PERSISTENT)
// =====================================================
(function earlyAccessCounter() {
    let base = localStorage.getItem("early_access_base");

    if (!base) {
        // starting point (you can change this number anytime)
        base = 1200;
        localStorage.setItem("early_access_base", base);
    }

    function updateCounter() {
        const el = document.getElementById("earlyAccessCount");
        if (!el) return;

        // simulate small growth over time (optional live feel)
        const now = Date.now();
        const growth = Math.floor((now / 60000) % 20); // grows slowly

        const value = parseInt(base) + growth;

        el.innerText = value;
    }

    setInterval(updateCounter, 3000);
})();
