const API_URL = "https://my-editor-website.onrender.com";

// ======================
// GET TOKEN
// ======================
function getToken() {
    return localStorage.getItem("adminToken");
}

// ======================
// AUTH HEADERS
// ======================
function authHeader() {
    return {
        "Content-Type": "application/json",
        "Authorization": getToken()
    };
}

// ======================
// ADMIN LOGIN (FIXED ROUTE)
// ======================
async function adminLogin() {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const message = document.getElementById("adminMessage");

    try {
        message.innerText = "Logging in...";

        const res = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        localStorage.setItem("adminToken", data.token);

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        loadDashboard();

    } catch (err) {
        message.innerText = err.message;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("adminToken");

    if (token) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        loadDashboard();
    } else {
        document.getElementById("loginBox").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
    }
});
function logout() {
    localStorage.removeItem("adminToken");
    location.reload();
}

// ======================
// LOAD STATS (FIXED FIELD SAFETY)
// ======================
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/admin/stats`, {
            headers: authHeader()
        });

        const data = await res.json();

        document.getElementById("totalUsers").innerText = data.totalUsers || 0;
        document.getElementById("verifiedUsers").innerText = data.verified || 0;
        document.getElementById("bannedUsers").innerText = data.banned || 0;

    } catch (err) {
        console.error(err);
    }
}

// ======================
// LOAD USERS (FIX SAFE OBJECT)
// ======================
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: authHeader()
        });

        const users = await res.json();

        const table = document.getElementById("usersTable");
        table.innerHTML = "";

        Object.values(users || {}).forEach(user => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${user.email || "No email"}</td>
                <td>${user.verified ? "✅" : "❌"}</td>
                <td>${user.banned ? "🚫" : "✅"}</td>
                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</td>
                <td>
                    <button onclick="banUser('${user.email}')">Ban</button>
                    <button onclick="deleteUser('${user.email}')">Delete</button>
                </td>
            `;

            table.appendChild(row);
        });

    } catch (err) {
        console.error(err);
    }
}

// ======================
// DELETE USER (FIX ROUTE MATCH)
// ======================
async function deleteUser(email) {
    await fetch(`${API_URL}/admin/user/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: authHeader()
    });

    loadUsers();
    loadStats();
}

// ======================
// BAN USER
// ======================
async function banUser(email) {
    await fetch(`${API_URL}/admin/ban`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ email })
    });

    loadUsers();
    loadStats();
}

// ======================
function refresh() {
    loadStats();
    loadUsers();
}

async function loadDashboard() {
    await loadStats();
    await loadUsers();
}

function logout() {
    localStorage.removeItem("adminToken");
    location.reload();
}
