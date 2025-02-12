import { DialogTitle } from "@headlessui/react";
import { Country, State } from "country-state-city";
import { useState } from "react";

import NewCardStage from "./NewCardStage";
import BillingAddressStage from "./BillingAddressStage";
import SelectCardStage from "./SelectCardStage";

interface PaymentDetails {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  default: boolean;
}

interface BillingAddress {
  country: string;
  state: string;
  postCode: string;
}

interface ConfirmStageProps {
  data?: {
    product: {
      id: string;
      name: string;
    };
    price: {
      id: string;
      name: string;
      unitAmount: number;
      currency: string;
      trial?: {
        days: number;
      };
      recurring?: {
        interval: string;
        intervalCount: number;
      };
    };
  };
  paymentDetails?: PaymentDetails;
  billingAddress?: BillingAddress;
  proration?: {
    credit: number;
    payment: number;
    total: number;
    lines: {
      description: string;
      amount: number;
      quantity: number;
      price: number;
    }[];
  };
  loading: boolean;
  onPaymentDetailsUpdate: (cardId: string) => void;
  onStartSubscription: VoidFunction;
  onClose: VoidFunction;
}

function getCtaButtonLabel(data: ConfirmStageProps["data"]) {
  if (!data) {
    return "Loading...";
  }

  const { price } = data;

  if (price.trial) {
    return `Start ${price.trial.days}-Day Trial`;
  }

  return price.recurring ? "Subscribe" : "Purchase";
}

export default function ConfirmStage({
  data,
  billingAddress,
  paymentDetails,
  proration,
  loading,
  onPaymentDetailsUpdate,
  onStartSubscription,
  onClose,
}: ConfirmStageProps) {
  const [updateInfo, setUpdateInfo] = useState<
    "newCard" | "selectCard" | "address"
  >();

  if (updateInfo === "selectCard") {
    return (
      <SelectCardStage
        currentSelectedCard={paymentDetails}
        onBack={() => {
          setUpdateInfo(undefined);
        }}
        onCardSelect={(card) => {
          onPaymentDetailsUpdate(card.id);
          setUpdateInfo(undefined);
        }}
      />
    );
  }

  if (updateInfo === "newCard") {
    return (
      <NewCardStage
        onBack={() => {
          setUpdateInfo(undefined);
        }}
        onCardAdded={(cardId) => {
          onPaymentDetailsUpdate(cardId);
          setUpdateInfo(undefined);
        }}
      />
    );
  }

  if (updateInfo === "address") {
    return (
      <BillingAddressStage
        onBack={() => {
          setUpdateInfo(undefined);
        }}
        onAddressUpdated={() => {
          setUpdateInfo(undefined);
        }}
      />
    );
  }

  return (
    <>
      <DialogTitle className="font-bold text-lg mb-6">Checkout</DialogTitle>
      <ul className="flex flex-col gap-4">
        <li>
          <h2 className="mb-1 font-medium">Selected Plan</h2>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body flex gap-4 flex-row justify-between">
              <div>
                <p>{data?.product.name}</p>
                <p>{data?.price.name}</p>
              </div>
              {data && (
                <div>
                  <div>
                    ${data.price.unitAmount / 100}{" "}
                    <span className="uppercase">{data.price.currency}</span>
                    {" / "}
                    {data.price.recurring && Boolean(data.price.unitAmount) && (
                      <span className="capitalize">
                        Every {data.price.recurring.interval}
                      </span>
                    )}
                    {!data.price.recurring && <span>One-Time</span>}
                    {!Boolean(data.price.unitAmount) && <span>Always</span>}
                  </div>
                  {data.price.trial && (
                    <div>Trial: {data.price.trial.days} days</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </li>
        <li>
          <h2 className="mb-1 font-medium">Billing Details</h2>
          {billingAddress && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body flex flex-row gap-2">
                <div className="flex-1">
                  <div>
                    {Country.getCountryByCode(billingAddress.country)?.name}
                  </div>
                  <div>
                    {
                      State.getStateByCodeAndCountry(
                        billingAddress.state,
                        billingAddress.country
                      )?.name
                    }
                  </div>
                  <div>{billingAddress.postCode}</div>
                </div>
                <div className="card-actions flex flex-col gap-2 items-stretch">
                  <button
                    className="btn btn-sm btn-neutral"
                    disabled={loading}
                    onClick={() => setUpdateInfo("address")}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
          {!billingAddress && <div>Loading...</div>}
        </li>
        <li>
          <h2 className="mb-1 font-medium">Payment Details</h2>
          {paymentDetails && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body flex flex-row gap-2">
                <div className="flex-1">
                  <div>{paymentDetails.brand}</div>
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-lg">
                      **** **** **** {paymentDetails.last4}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    Expires: {paymentDetails.expMonth}/{paymentDetails.expYear}
                  </div>
                </div>
                <div className="card-actions flex flex-col gap-2 items-stretch">
                  <button
                    className="btn btn-sm btn-neutral"
                    disabled={loading}
                    onClick={() => setUpdateInfo("selectCard")}
                  >
                    Change
                  </button>
                  <button
                    className="btn btn-sm btn-neutral"
                    disabled={loading}
                    onClick={() => setUpdateInfo("newCard")}
                  >
                    New Card
                  </button>
                </div>
              </div>
            </div>
          )}
          {!paymentDetails && <div>Loading...</div>}
        </li>
        {proration && (
          <li>
            <h2 className="mb-1 font-medium">Proration</h2>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex flex-row gap-2">
                  <div className="flex-1">
                    <div>
                      <span className="font-bold">Credit:</span>{" "}
                      {proration.credit / 100}
                    </div>
                    <div>
                      <span className="font-bold">Payment:</span>{" "}
                      {proration.payment / 100}
                    </div>
                    <div>
                      <span className="font-bold">Total:</span>{" "}
                      {proration.total / 100}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">Details</h3>
                    <ul>
                      {proration.lines.map((line, index) => (
                        <li key={index}>
                          <div>{line.description}</div>
                          <div>
                            {line.amount / 100} x {line.quantity} ={" "}
                            {line.price / 100}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>
        )}
      </ul>
      <div className="modal-action">
        <button className="btn btn-ghost" disabled={loading} onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={loading}
          onClick={onStartSubscription}
        >
          {getCtaButtonLabel(data)}
        </button>
      </div>
    </>
  );
}
