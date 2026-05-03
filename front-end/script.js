const API_URL = "https://my-editor-website.onrender.com";

// ======================
// ⏳ COUNTDOWN (6 MONTHS)
// ======================
const launchDate = new Date();
launchDate.setMonth(launchDate.getMonth() + 6);

const countdown = document.getElementById("countdown");

function updateCountdown() {
    if (!countdown) return;

    const now = Date.now();
    const diff = launchDate.getTime() - now;

    if (diff <= 0) {
        countdown.innerText = "🚀 LAUNCHED";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdown.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ======================
// 🚀 WAITLIST REGISTER (FIXED)
// ======================
const form = document.getElementById("preRegForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const input = form.querySelector("input");
        const message = document.getElementById("message");
        const email = input?.value?.trim();

        if (!email) {
            message.innerText = "Please enter email";
            return;
        }

        message.innerText = "Registering...";

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                message.innerText = data.message || "Error registering";
                return;
            }

            message.innerText = "Registered 🚀";
            localStorage.setItem("email", email);

            loadSlots();
            init();

        } catch (err) {
            console.error(err);
            message.innerText = "Server error. Try again.";
        }
    });
}

// ======================
// 🔥 EARLY ACCESS SLOTS
// ======================
async function loadSlots() {
    const slots = document.getElementById("slots");
    const spots = document.getElementById("spots");

    try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();

        const maxSlots = 300;
        const remaining = Math.max(0, maxSlots - (data.totalUsers || 0));

        if (slots) slots.innerText = remaining;
        if (spots) spots.innerText = remaining;

    } catch {
        if (slots) slots.innerText = "300";
        if (spots) spots.innerText = "300";
    }
}

loadSlots();

// ======================
// ✨ SCROLL ANIMATION
// ======================
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
});

document.querySelectorAll(".card").forEach(card => {
    card.classList.add("fade-in");
    observer.observe(card);
});

// ======================
// 🔐 ACCESS CHECK
// ======================
async function checkAccess(email) {
    if (!email) return false;

    try {
        const res = await fetch(
            `${API_URL}/check-subscription?email=${email}`
        );

        const data = await res.json();
        return data.paid === true;

    } catch {
        return false;
    }
}

// ======================
// 🚀 INIT (EDITOR UNLOCK)
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

    const paid = await checkAccess(email);

    if (paid) {
        editor.style.display = "block";
        paywall.style.display = "none";
    } else {
        editor.style.display = "none";
        paywall.style.display = "block";
    }
}

init();

// ======================
// 🔥 AUTO LOGIN HOOK
// ======================
const urlParams = new URLSearchParams(window.location.search);
const paypalEmail = urlParams.get("email");

if (paypalEmail) {
    localStorage.setItem("email", paypalEmail);
    init();
    loadSlots();
}