const API_URL = "https://my-editor-website.onrender.com/";

let token = "";

// ======================
// ADMIN LOGIN
// ======================
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await res.json();

    if (res.ok) {
        token = data.token;

        localStorage.setItem("adminToken", token);

        window.location.href = "admin.html"; // redirect after login
    } else {
        document.getElementById("msg").innerText =
            data.message || "Login failed";
    }
}

// ======================
// AUTH HEADER HELPER
// ======================
function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("adminToken")
    };
}

// ======================
// LOAD USERS
// ======================
async function loadUsers() {
    const res = await fetch(`${API_URL}/admin/users`, {
        headers: authHeaders()
    });

    const users = await res.json();

    const list = document.getElementById("users");
    list.innerHTML = "";

    users.forEach(u => {
        const li = document.createElement("li");
        li.innerText = u.email;
        list.appendChild(li);
    });
}

// ======================
// STATS
// ======================
async function loadStats() {
    const res = await fetch(`${API_URL}/stats`, {
        headers: authHeaders()
    });

    const data = await res.json();

    document.getElementById("stats").innerText =
        "Total Users: " + data.totalUsers;
}

// ======================
// REVENUE
// ======================
async function loadRevenue() {
    const res = await fetch(`${API_URL}/revenue`, {
        headers: authHeaders()
    });

    const data = await res.json();

    document.getElementById("revenue").innerText =
        `Revenue: $${data.revenue}`;
}

// ======================
// SEND EMAIL
// ======================
async function sendEmail() {
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("emailMessage").value;

    const res = await fetch(`${API_URL}/send-email`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ subject, message })
    });

    const data = await res.json();
    alert(data.message);
}