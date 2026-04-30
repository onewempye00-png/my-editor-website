import app from "./firebase.js";
const launchDate = new Date("2026-06-30T00:00:00").getTime();
const countdown = document.getElementById("countdown");

setInterval(() => {
    const now = new Date().getTime();
    const diff = launchDate - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdown.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}, 1000);

// REGISTER
document.getElementById("preRegForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.querySelector("input").value;
    const message = document.getElementById("message");

    try {
        const res = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        message.innerText = res.ok ? "Registered 🚀" : data.message;

    } catch {
        message.innerText = "Server error";
    }
});
// ✨ SCROLL ANIMATION
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

async function loadSpots() {
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();

    const left = 100 - data.totalUsers;
    document.getElementById("spots").innerText = left;
}

loadSpots();