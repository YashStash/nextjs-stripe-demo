import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { FormEvent, useState } from "react";

function setDefaultPaymentMethod(paymentMethodId: string) {
  return fetch("/api/profile/paymentDetails/defaultPaymentMethod", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodId,
    }),
  });
}

interface NewCardFormProps {
  onCardAdded: (cardId: string) => void;
}

export default function NewCardForm({ onCardAdded }: NewCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (!error && setupIntent && setupIntent.status === "succeeded") {
      if (setupIntent.payment_method) {
        if (typeof setupIntent.payment_method === "string") {
          await setDefaultPaymentMethod(setupIntent.payment_method);
          onCardAdded(setupIntent.payment_method);
        } else {
          await setDefaultPaymentMethod(setupIntent.payment_method.id);
          onCardAdded(setupIntent.payment_method.id);
        }
      }

      return;
    }

    setLoading(false);
    if (
      error &&
      (error.type === "card_error" || error.type === "validation_error")
    ) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage("An unexpected error occurred.");
    }
  };

  return (
    <form className="max-w-lg" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          readOnly: loading,
        }}
      />
      <button
        className="btn btn-primary w-full mt-4"
        disabled={!stripe || loading}
      >
        Submit
      </button>
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
}
