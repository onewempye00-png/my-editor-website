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
            try {
                const subscriptionID = data.subscriptionID;
                const email = localStorage.getItem("email");

                if (!email) {
                    alert("Please enter email first");
                    return;
                }

                const res = await fetch(`${API_URL}/save-payment`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        subscriptionID
                    })
                });

                if (!res.ok) {
                    throw new Error("Payment save failed");
                }

                localStorage.setItem("paid", "true");

                window.location.href = "dashboard.html";

            } catch (err) {
                console.error("PAYPAL ERROR:", err);
                alert("Payment error. Try again.");
            }
        }

    }).render(`#${containerId}`);
}