import { useEffect, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import API from "../api/axios";

function CheckoutForm({ bookingId }) {
  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPaymentIntent();
  }, []);

  const loadPaymentIntent = async () => {
    try {
      const res = await API.post("/payments/create-payment-intent", {
        bookingId,
      });

      setClientSecret(res.data.clientSecret);
    } catch (error) {
      setMessage("Failed to initialize payment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    const card = elements.getElement(CardElement);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
      },
    });

    if (result.error) {
      setMessage(result.error.message);
    } else if (result.paymentIntent.status === "succeeded") {
        await API.post("/payments/mark-paid", {
          bookingId,
          paymentIntentId: result.paymentIntent.id,
        });

        setMessage("Payment Successful!");
      }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="border rounded-lg p-4 mb-5">
        <CardElement />
      </div>

      {message && (
        <p className="mb-4 text-center font-semibold">{message}</p>
      )}

      <button
        disabled={!stripe || loading}
        className="w-full bg-slate-900 text-white py-3 rounded-lg"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default CheckoutForm;