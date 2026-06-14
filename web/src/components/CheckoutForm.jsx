import { useEffect, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Link } from "react-router-dom";
import API from "../api/axios";

const cardOptions = {
  hidePostalCode: false,
  style: {
    base: {
      color: "#0f172a",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: "16px",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#e11d48", iconColor: "#e11d48" },
  },
};

const friendlyCardError = (error) => {
  const messages = {
    card_declined: "Your card was declined. Try another card or contact your bank.",
    expired_card: "This card has expired. Please use a different card.",
    incorrect_cvc: "The security code is incorrect. Check it and try again.",
    incomplete_cvc: "Enter the complete security code from your card.",
    incomplete_expiry: "Enter the complete card expiry date.",
    incomplete_number: "Enter the complete card number.",
    processing_error: "Your bank could not process the payment. Please try again.",
  };
  return messages[error?.code] || error?.message || "Payment could not be completed. Please check your details and try again.";
};

function AlertMessage({ type, children }) {
  const success = type === "success";
  return (
    <div role="alert" className={"flex gap-3 rounded-2xl border p-4 text-sm " + (success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800")}>
      <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black text-white " + (success ? "bg-emerald-500" : "bg-rose-500")}>{success ? "✓" : "!"}</span>
      <span className="leading-6">{children}</span>
    </div>
  );
}

function CheckoutForm({ bookingId, onBookingLoaded }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [notice, setNotice] = useState(null);
  const [retry, setRetry] = useState(0);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let active = true;
    API.post("/payments/create-payment-intent", { bookingId })
      .then(({ data }) => {
        if (!active) return;
        setClientSecret(data.clientSecret);
        onBookingLoaded(data.booking);
      })
      .catch((error) => {
        if (!active) return;
        setNotice({ type: "error", text: error.response?.data?.message || "We could not prepare the secure payment form. Please try again." });
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => { active = false; };
  }, [bookingId, onBookingLoaded, retry]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret || !cardComplete) {
      setNotice({ type: "error", text: "Complete all card details before continuing." });
      return;
    }

    try {
      setProcessing(true);
      setNotice(null);
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });

      if (result.error) {
        setNotice({ type: "error", text: friendlyCardError(result.error) });
        return;
      }
      if (result.paymentIntent?.status !== "succeeded") {
        setNotice({ type: "error", text: "Your payment is still processing. Please wait a moment and check your bookings." });
        return;
      }

      await API.post("/payments/mark-paid", {
        bookingId,
        paymentIntentId: result.paymentIntent.id,
      });
      setPaid(true);
      setNotice({ type: "success", text: "Payment confirmed. Your ride is ready for the next step." });
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "We could not confirm the payment. If your card was charged, check My Bookings before trying again." });
    } finally {
      setProcessing(false);
    }
  };

  if (initializing) {
    return <div className="space-y-4"><div className="h-5 w-40 animate-pulse rounded bg-slate-200" /><div className="h-16 animate-pulse rounded-2xl bg-slate-100" /><div className="h-14 animate-pulse rounded-2xl bg-slate-200" /></div>;
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        {notice && <AlertMessage type="error">{notice.text}</AlertMessage>}
        <button type="button" onClick={() => { setInitializing(true); setNotice(null); setRetry((value) => value + 1); }} className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white hover:bg-slate-800">Try again</button>
        <Link to="/my-bookings" className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-800">Return to My Bookings</Link>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="py-3 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</span>
        <h2 className="mt-5 text-2xl font-black text-slate-950">Payment complete</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Your receipt and booking status are available in your travel dashboard.</p>
        {notice && <div className="mt-5 text-left"><AlertMessage type="success">{notice.text}</AlertMessage></div>}
        <Link to="/my-bookings" className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500">View my booking</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between"><label className="text-sm font-bold text-slate-800">Card information</label><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Powered by Stripe</span></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
          <CardElement options={cardOptions} onChange={(event) => {
            setCardComplete(event.complete);
            if (event.error) setNotice({ type: "error", text: friendlyCardError(event.error) });
            else if (notice?.type === "error") setNotice(null);
          }} />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Your card details are encrypted and sent directly to Stripe. They are never stored by CarBooking.</p>
      </div>

      {notice && <AlertMessage type={notice.type}>{notice.text}</AlertMessage>}

      <button disabled={!stripe || processing || !cardComplete} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
        {processing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Processing securely...</> : "Pay securely"}
      </button>
      <div className="flex items-center justify-center gap-5 text-[11px] font-semibold text-slate-400"><span>🔒 SSL encrypted</span><span>✓ PCI compliant</span><span>↩ Refund protection</span></div>
    </form>
  );
}

export default CheckoutForm;
