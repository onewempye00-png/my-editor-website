const API_URL = "https://my-editor-website.onrender.com";

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/admin-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const text = await res.text(); // 👈 IMPORTANT

        console.log("RAW RESPONSE:", text);

        const data = JSON.parse(text);

        if (!res.ok) {
            alert(data.message || "Login failed");
            return;
        }

        localStorage.setItem("admin_token", data.token);
        window.location.href = "admin.html";

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        alert("Check console (F12)");
    }
}