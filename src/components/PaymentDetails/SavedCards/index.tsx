"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SavedCard from "./SavedCard";

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

export default function PaymentDetailsSavedCards() {
  const router = useRouter();
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>();

  const loadSavedCards = useCallback(
    function loadSavedCards() {
      getSavedCards().then((result) => {
        if (!result.data || result.data.length === 0) {
          router.push("/?tab=paymentDetails.newCard");
          return;
        }

        setSavedCards(result.data);
      });
    },
    [router]
  );

  function handleDelete() {
    loadSavedCards();
  }

  function handleSetDefault() {
    loadSavedCards();
  }

  useEffect(() => {
    loadSavedCards();
  }, [loadSavedCards]);

  return (
    <div className="max-w-lg">
      {savedCards ? (
        <ul className="flex flex-col gap-4">
          {savedCards.map((card) => (
            <li key={card.id}>
              <SavedCard
                card={card}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
