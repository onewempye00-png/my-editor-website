const API_URL = "https://my-editor-website.onrender.com";

async function login() {
    const email = document.getElementById("email").value;

    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Login failed");
        return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("email", email);

    window.location.href = "dashboard.html";
}
