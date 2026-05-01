const API_URL = "https://my-editor-website.onrender.com";

// ======================
// PAYPAL SUBSCRIPTION CONFIG
// ======================
const PLAN_ID = "P-3LE982142A1209921NH2GCUI";

// ======================
// RENDER PAYPAL BUTTON
// ======================
export function initPayPalButton(containerId = "paypal-button-container") {

    paypal.Buttons({
        style: {
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: "subscribe"
        },

        // ======================
        // CREATE SUBSCRIPTION
        // ======================
        createSubscription: function (data, actions) {
            return actions.subscription.create({
                plan_id: PLAN_ID
            });
        },

        // ======================
        // SUCCESS (USER PAID)
        // ======================
        onApprove: async function (data) {

            const subscriptionID = data.subscriptionID;
            const email = localStorage.getItem("email");

            if (!email) {
                alert("Please enter email first");
                return;
            }

            // 🔥 SEND TO BACKEND (IMPORTANT)
            await fetch(`${API_URL}/save-payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    subscriptionID
                })
            });

            // 🔥 STORE LOCALLY (for instant UX)
            localStorage.setItem("paid", "true");

            // redirect
            window.location.href = "dashboard.html";
        }

    }).render(`#${containerId}`);
}