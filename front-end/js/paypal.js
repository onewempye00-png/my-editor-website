const API_URL = "https://my-editor-website.onrender.com";
const PLAN_ID = "P-3LE982142A1209921NH2GCUI";

export function initPayPalButton(containerId = "paypal-button-container") {

    paypal.Buttons({
        style: {
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: "subscribe"
        },

        createSubscription: (data, actions) => {
            return actions.subscription.create({
                plan_id: PLAN_ID
            });
        },

        onApprove: async (data) => {

            const subscriptionID = data.subscriptionID;
            const email = localStorage.getItem("email");

            if (!email) {
                alert("Login required first");
                return;
            }

            // send to backend
            await fetch(`${API_URL}/api/paypal/confirm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    subscriptionID
                })
            });

            localStorage.setItem("paid", "true");

            window.location.href = "dashboard.html";
        }

    }).render(`#${containerId}`);
}