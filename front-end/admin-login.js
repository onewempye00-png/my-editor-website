const API_URL = "https://my-editor-website.onrender.com";

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
        document.getElementById("msg").innerText = data.message;
        return;
    }

    localStorage.setItem("admin_token", data.token);

    window.location.href = "admin-dashboard.html";
}
