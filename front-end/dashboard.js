const API_URL = "https://my-editor-website.onrender.com";

// ======================
// AUTH CHECK
// ======================
const token = localStorage.getItem("admin_token");

if (!token) {
    window.location.href = "admin-login.html";
}

// ======================
// LOAD STATS
// ======================
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/stats`, {
            headers: {
                Authorization: token
            }
        });

        const data = await res.json();

        document.getElementById("output").textContent =
            "📊 STATS\n" + JSON.stringify(data, null, 2);

    } catch (err) {
        console.error(err);
        alert("Failed to load stats");
    }
}

// ======================
// LOAD USERS
// ======================
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: {
                Authorization: token
            }
        });

        const data = await res.json();

        document.getElementById("output").textContent =
            "👥 USERS\n" + JSON.stringify(data, null, 2);

    } catch (err) {
        console.error(err);
        alert("Failed to load users");
    }
}

// ======================
// LOGOUT
// ======================
function logout() {
    localStorage.removeItem("admin_token");
    window.location.href = "admin-login.html";
}