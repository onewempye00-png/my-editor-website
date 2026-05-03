const API_URL = "https://my-editor-website.onrender.com";

const token = localStorage.getItem("token");
const email = localStorage.getItem("email");

// ======================
// LOGOUT
// ======================
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    window.location.href = "login.html";
}

// ======================
// LOAD DASHBOARD
// ======================
async function loadDashboard() {

    if (!token || !email) {
        document.body.innerHTML = "<h2>❌ Not logged in</h2>";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/check-subscription?email=${email}`);

        const data = await res.json();

        document.getElementById("userEmail").innerText = email;
        document.getElementById("plan").innerText =
            data.paid ? "💎 Premium Plan" : "🆓 Free Plan";

    } catch (err) {
        console.error(err);
        document.body.innerHTML = "<h2>⚠️ Failed to load dashboard</h2>";
    }
}

loadDashboard();