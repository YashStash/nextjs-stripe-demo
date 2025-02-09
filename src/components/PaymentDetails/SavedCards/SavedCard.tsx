"use client";

import React from "react";

async function deleteSavedCard(id: string) {
  return fetch(`/api/profile/paymentDetails?id=${id}`, {
    method: "DELETE",
  }).then((res) => res.json());
}

async function setDefaultPaymentMethod(paymentMethodId: string) {
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

interface SavedCardProps {
  card: {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    default: boolean;
  };
  onDelete?: VoidFunction;
  onSelect?: VoidFunction;
  onSetDefault?: VoidFunction;
}

function SavedCard({ card, onDelete, onSelect, onSetDefault }: SavedCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSettingDefault, setIsSettingDefault] = React.useState(false);
  const { brand, last4, expMonth, expYear, default: defaultCard } = card;

  function handleRemove() {
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    deleteSavedCard(card.id)
      .then(() => {
        onDelete();
      })
      .catch(() => {
        setIsDeleting(false);
      });
  }

  function handleSetDefault() {
    if (!onSelect) {
      return;
    }

    setIsSettingDefault(true);
    setDefaultPaymentMethod(card.id)
      .then(() => {
        onSelect();
      })
      .catch(() => {
        setIsSettingDefault(false);
      });
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body flex flex-row gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 capitalize">
            {defaultCard && <div className="badge badge-neutral">Default</div>}
            {brand}
          </div>
          <div className="flex justify-between items-center">
            <div className="font-bold text-lg">**** **** **** {last4}</div>
          </div>
          <div className="mt-2 text-sm">
            Expires: {expMonth}/{expYear}
          </div>
        </div>
        {(onDelete || onSelect) && (
          <div className="card-actions flex flex-col gap-2 items-stretch">
            {onDelete && (
              <button
                className="btn btn-sm btn-error"
                disabled={isDeleting}
                onClick={handleRemove}
              >
                {isDeleting ? "Deleting..." : "Remove"}
              </button>
            )}
            {onSetDefault && !defaultCard && (
              <button
                className="btn btn-sm btn-neutral"
                disabled={isSettingDefault}
                onClick={handleSetDefault}
              >
                {isSettingDefault ? "Setting default..." : "Set default"}
              </button>
            )}
            {onSelect && (
              <button className="btn btn-sm btn-primary" onClick={onSelect}>
                Select
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedCard;
