import crypto from 'crypto';
import createRazorPayInstance from "../config/razorPay.config.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const razorPayInstance = createRazorPayInstance();

export const createOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount))) {
        throw new ApiError(400, "Valid numeric amount is required for creating order");
    }

    const options = {
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`
    };

    try {
        const order = await razorPayInstance.orders.create(options);
        return res.status(200).json(new ApiResponse(200, order, "Order created successfully", true));
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        throw new ApiError(500, error?.error?.description || error?.message || "Failed to create Razorpay order");
    }
});

export const veriFyPayment = asyncHandler(async (req, res) => {
    const { order_id, payment_id, signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
        // Fallback for dev if keys not populated
        return res.status(200).json(new ApiResponse(200, { verified: true }, "Payment verified in test mode", true));
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${order_id}|${payment_id}`);
    const generateSignature = hmac.digest("hex");

    if (generateSignature === signature) {
        return res.status(200).json(new ApiResponse(200, { verified: true }, "Payment verified successfully", true));
    }

    throw new ApiError(400, "Payment signature verification failed");
});
