import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../stripe";
import CheckoutForm from "../components/CheckoutForm";
import { useParams } from "react-router-dom";

function PaymentPage() {
  const { bookingId } = useParams();

  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold mb-6">Complete Payment</h1>

        <Elements stripe={stripePromise}>
          <CheckoutForm bookingId={bookingId} />
        </Elements>
      </div>
    </div>
  );
}

export default PaymentPage;