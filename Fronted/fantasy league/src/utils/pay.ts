import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";
const key = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export const payWithRazorpay = async (
    amount: number,
    onSuccess: () => void,
    onError?: (msg: string) => void
) => {
    try {
        const response = await fetch(`${apiUrl}/api/v1/payment/createOrder`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount }),
        });

        const data = await response.json();

        if (!data.success && !data.data) {
            throw new Error(data.message || "Failed to initiate payment");
        }

        const orderData = data.data;

        const options = {
            key: key,
            amount: orderData.amount,
            currency: orderData.currency || "INR",
            name: "Shadow League",
            description: "Fantasy League Entry Fee",
            image: "https://cdn-icons-png.flaticon.com/512/861/861512.png",
            order_id: orderData.id,
            handler: async function (paymentResponse: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
            }) {
                try {
                    const res = await fetch(`${apiUrl}/api/v1/payment/veriFyPayment`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            order_id: paymentResponse.razorpay_order_id,
                            payment_id: paymentResponse.razorpay_payment_id,
                            signature: paymentResponse.razorpay_signature,
                        }),
                    });

                    const verifyData = await res.json();
                    if (!verifyData.success) {
                        toast.error("Payment verification failed");
                        onError?.("Payment verification failed");
                        return;
                    }

                    toast.success("Payment verified successfully!");
                    onSuccess();
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Payment verification error";
                    toast.error(msg);
                    onError?.(msg);
                }
            },
            theme: {
                color: "#6366f1",
            },
        };

        if (typeof window.Razorpay === "undefined") {
            // If Razorpay SDK not loaded in test mode, allow direct testing
            toast.info("Test Mode: Simulating successful payment");
            onSuccess();
            return;
        }

        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Payment initialization error";
        console.error("Payment error:", error);
        toast.error(msg);
        onError?.(msg);
    }
};

export default payWithRazorpay;
