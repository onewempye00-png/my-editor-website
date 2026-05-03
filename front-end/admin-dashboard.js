const API_URL = "https://my-editor-website.onrender.com";
const token = localStorage.getItem("admin_token");

async function loadStats() {
    const res = await fetch(`${API_URL}/stats`, {
        headers: {
            Authorization: token
        }
    });

    const data = await res.json();

    document.getElementById("output").textContent =
        JSON.stringify(data, null, 2);
}

async function loadUsers() {
    const res = await fetch(`${API_URL}/admin/users`, {
        headers: {
            Authorization: token
        }
    });

    const data = await res.json();

    document.getElementById("output").textContent =
        JSON.stringify(data, null, 2);
}
