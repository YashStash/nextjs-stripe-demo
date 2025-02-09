import { useCallback, useEffect, useState } from "react";

import SavedCard from "~/components/PaymentDetails/SavedCards/SavedCard";
import { DialogTitle } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";

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

interface PaymentDetailsSavedCardsProps {
  currentSelectedCard?: PaymentMethod;
  onBack?: VoidFunction;
  onCardSelect: (card: PaymentMethod) => void;
}

export default function PaymentDetailsSavedCards({
  currentSelectedCard,
  onBack,
  onCardSelect,
}: PaymentDetailsSavedCardsProps) {
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>();

  const loadSavedCards = useCallback(function loadSavedCards() {
    getSavedCards().then((result) => {
      if (!result.data || result.data.length === 0) {
        return;
      }

      setSavedCards(result.data);
    });
  }, []);

  useEffect(() => {
    loadSavedCards();
  }, [loadSavedCards]);

  const otherCards = savedCards
    ? savedCards.filter((card) => card.id !== currentSelectedCard?.id)
    : [];

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
      {currentSelectedCard && (
        <div className="mb-4">
          <h3 className="mb-1 font-medium">Currently Selected</h3>
          <SavedCard card={currentSelectedCard} />
        </div>
      )}
      <h3 className="mb-1 font-medium">Other Cards</h3>
      {savedCards ? (
        <ul className="flex flex-col gap-4">
          {otherCards
            .filter((card) => card.id !== currentSelectedCard?.id)
            .map((card) => (
              <li key={card.id}>
                <SavedCard card={card} onSelect={() => onCardSelect(card)} />
              </li>
            ))}
          {otherCards.length === 0 && <div>No other cards found</div>}
        </ul>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}
