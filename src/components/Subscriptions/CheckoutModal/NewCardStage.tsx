"use client";

import { DialogTitle } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

import NewCardForm from "~/components/PaymentDetails/NewCard/NewCardForm";
import SavedCard from "~/components/PaymentDetails/SavedCards/SavedCard";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  default: boolean;
}

async function getSavedCards(): Promise<{ data: PaymentMethod[] }> {
  return fetch("/api/profile/paymentDetails").then((res) => res.json());
}

async function getPaymentDetailsSetup() {
  return fetch("/api/profile/paymentDetails/setup").then((res) => res.json());
}

interface NewCardStageProps {
  showExistingCards?: boolean;
  onCardAdded: (cardId: string) => void;
  onBack?: VoidFunction;
  onCardSelect?: (cardId: string) => void;
}

export default function NewCardStage({
  showExistingCards,
  onBack,
  onCardAdded,
  onCardSelect,
}: NewCardStageProps) {
  const [paymentDetails, setPaymentDetails] = useState<{
    id: string;
    clientSecret: string;
  }>();
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>();

  useEffect(() => {
    getPaymentDetailsSetup().then((result) => {
      if (!result.data) {
        return;
      }

      setPaymentDetails(result.data);
    });

    if (showExistingCards) {
      getSavedCards().then((result) => {
        if (!result.data || result.data.length === 0) {
          return;
        }

        setSavedCards(result.data);
      });
    }
  }, [showExistingCards]);

  function handleCardAdded(cardId: string) {
    onCardAdded(cardId);
  }

  if (!paymentDetails) {
    return <div>Loading...</div>;
  }

  const otherCards = savedCards ? savedCards : [];

  return (
    <>
      <DialogTitle className="font-bold text-lg mb-6 flex gap-2 items-center">
        {onBack && (
          <button className="btn btn-circle btn-xs" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}
        New Card
      </DialogTitle>
      <Elements
        stripe={stripePromise}
        options={{ clientSecret: paymentDetails.clientSecret }}
      >
        <NewCardForm onCardAdded={handleCardAdded} />
      </Elements>
      {showExistingCards && onCardSelect && Boolean(otherCards.length) && (
        <>
          <h3 className="mb-1 font-medium mt-6">Other Cards</h3>
          <ul className="flex flex-col gap-4">
            {otherCards.map((card) => (
              <li key={card.id}>
                <SavedCard card={card} onSelect={() => onCardSelect(card.id)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
