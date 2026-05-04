const API_URL = "https://my-editor-website.onrender.com";

// ======================
// SAFE FETCH HELPER
// ======================
async function safeFetch(url, options = {}) {
    const res = await fetch(url, options);

    let data;
    try {
        data = await res.json();
    } catch {
        const text = await res.text();
        console.error("❌ Non-JSON response:", text);
        throw new Error("Server returned invalid JSON");
    }

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

// ======================
// REGISTER → SEND CODE
// ======================
const form = document.getElementById("preRegForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = form.querySelector("input").value.trim();
        const message = document.getElementById("message");

        if (!email) {
            message.innerText = "Enter email";
            return;
        }

        try {
            message.innerText = "Sending code...";

            await safeFetch(`${API_URL}/send-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            message.innerText = "Check your email 📧";

            localStorage.setItem("email", email);

            document.getElementById("codeSection").style.display = "block";

        } catch (err) {
            console.error(err);
            message.innerText = err.message;
        }
    });
}

// ======================
// VERIFY CODE
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
        console.error(err);
        message.innerText = err.message;
    }
}

// ======================
// GOOGLE LOGIN
// ======================
window.handleGoogleLogin = function (response) {
    const token = response.credential;

    fetch(`${API_URL}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);

        console.log("✅ Google login success");
        init();
    })
    .catch(err => console.error("Google login error:", err));
};

// ======================
// COUNTDOWN
// ======================
const launchDate = new Date();
launchDate.setMonth(launchDate.getMonth() + 6);

const countdown = document.getElementById("countdown");

function updateCountdown() {
    if (!countdown) return;

    const diff = launchDate - Date.now();

    if (diff <= 0) {
        countdown.innerText = "🚀 LIVE";
        return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    countdown.innerText = `${d}d ${h}h ${m}m ${s}s`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ======================
// INIT SYSTEM
// ======================
async function init() {
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
