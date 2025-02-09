"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import NewCardForm from "./NewCardForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

async function getPaymentDetailsSetup() {
  return fetch("/api/profile/paymentDetails/setup").then((res) => res.json());
}

export default function NewCard() {
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<{
    id: string;
    clientSecret: string;
  }>();

  useEffect(() => {
    getPaymentDetailsSetup().then((result) => {
      if (!result.data) {
        return;
      }

      setPaymentDetails(result.data);
    });
  }, []);

  function handleCardAdded() {
    router.push("/?tab=paymentDetails.savedCards");
  }

  if (!paymentDetails) {
    return <div>Loading...</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: paymentDetails.clientSecret }}
    >
      <NewCardForm onCardAdded={handleCardAdded} />
    </Elements>
  );
}
