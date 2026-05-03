const API_URL = "https://my-editor-website.onrender.com";

const token = localStorage.getItem("token");
const email = localStorage.getItem("email");

async function loadDashboard() {
    if (!token || !email) {
        window.location.href = "login.html";
        return;
    }

    const res = await fetch(`${API_URL}/check-subscription?email=${email}`);

    const data = await res.json();

    document.getElementById("userEmail").innerText = email;
    document.getElementById("plan").innerText =
        data.paid ? "💎 Premium Plan" : "🆓 Free Plan";
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    window.location.href = "login.html";
}

loadDashboard();
