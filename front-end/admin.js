let token = "";

async function login() {
    const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    const data = await res.json();

    if (res.ok) {
        token = data.token;
        login.style.display = "none";
        dashboard.style.display = "block";
        loadStats();
    } else {
        alert(data.message);
    }
}

async function loadUsers() {
    const res = await fetch("http://localhost:5000/users", {
        headers: { Authorization: token }
    });

    const users = await res.json();
    usersList = document.getElementById("users");
    usersList.innerHTML = "";

    users.forEach(u => {
        const li = document.createElement("li");
        li.innerText = u.email;
        usersList.appendChild(li);
    });
}

async function loadStats() {
    const res = await fetch("http://localhost:5000/stats", {
        headers: { Authorization: token }
    });

    const data = await res.json();
    stats.innerText = "Total Users: " + data.totalUsers;
}

async function sendEmail() {
    const res = await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: token
        },
        body: JSON.stringify({
            subject: subject.value,
            message: emailMessage.value
        })
    });

    const data = await res.json();
    alert(data.message);
}