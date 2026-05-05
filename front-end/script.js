const API_URL = "https://my-editor-website.onrender.com";

// ======================
async function safeFetch(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);

    if (!res.ok) throw new Error(data?.message || "Request failed");
    return data;
}

// ======================
// REGISTER + SEND OTP
// ======================
const form = document.getElementById("preRegForm");

form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.querySelector("input").value.trim();
    const message = document.getElementById("message");

    try {
        message.innerText = "Sending OTP...";

        await safeFetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        await safeFetch(`${API_URL}/send-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        localStorage.setItem("email", email);
        document.getElementById("codeSection").style.display = "block";

        message.innerText = "Check email 📧";

    } catch (err) {
        message.innerText = err.message;
    }
});

// ======================
// VERIFY OTP
// ======================
async function verifyCode() {
    const email = localStorage.getItem("email");
    const code = document.getElementById("codeInput").value;

    const message = document.getElementById("message");

    try {
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
// GOOGLE LOGIN FIXED
// ======================
window.handleGoogleLogin = async function (response) {
    try {
        const data = await safeFetch(`${API_URL}/google-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential })
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);

        init();

    } catch (err) {
        console.error(err);
    }
};

// ======================
const launchDate = new Date();
launchDate.setMonth(launchDate.getMonth() + 6);

setInterval(() => {
    const el = document.getElementById("countdown");
    if (!el) return;

    const diff = launchDate - Date.now();

    if (diff <= 0) return el.innerText = "LIVE";

    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000 % 24);
    const m = Math.floor(diff / 60000 % 60);
    const s = Math.floor(diff / 1000 % 60);

    el.innerText = `${d}d ${h}h ${m}m ${s}s`;
}, 1000);

// ======================
async function init() {
    const email = localStorage.getItem("email");
    const editor = document.getElementById("editor");
    const paywall = document.getElementById("paywall");

    if (!email) {
        paywall.style.display = "block";
        editor.style.display = "none";
        return;
    }

    editor.style.display = "block";
    paywall.style.display = "none";
}

init();