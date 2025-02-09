import { Dialog, DialogPanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

import ConfirmStage from "./ConfirmStage";
import clsx from "clsx";
import NewCardStage from "./NewCardStage";
import BillingAddressStage from "./BillingAddressStage";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface PaymentDetails {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  default: boolean;
}

async function getDefaultPaymentMethod(): Promise<{ data: PaymentDetails }> {
  return fetch("/api/profile/paymentDetails/defaultPaymentMethod").then((res) =>
    res.json()
  );
}

async function getPaymentMethods(): Promise<{ data: PaymentDetails[] }> {
  return fetch("/api/profile/paymentDetails").then((res) => res.json());
}

interface BillingAddress {
  country: string;
  state: string;
  postCode: string;
}

async function getBillingAddress(): Promise<{ data: BillingAddress }> {
  return fetch("/api/profile/billingAddress").then((res) => res.json());
}

async function startSubscription(
  priceId: string,
  defaultPaymentMethodId: string
) {
  return fetch("/api/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      priceId,
      defaultPaymentMethodId,
    }),
  }).then((res) => res.json());
}

async function payInvoice(invoiceId: string) {
  return fetch("/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceId }),
  }).then((res) => res.json());
}

interface CheckoutModalProps {
  onClose: VoidFunction;
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
      recurring?: {
        interval: string;
        intervalCount: number;
      };
    };
  };
}

export default function CheckoutModal({ onClose, data }: CheckoutModalProps) {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>();
  const [billingAddress, setBillingAddress] = useState<BillingAddress>();
  const [stages, setStages] = useState<("confirm" | "payment" | "address")[]>([
    "confirm",
  ]);
  const [stage, setStage] = useState<(typeof stages)[0]>(stages[0]);
  const [loading, setLoading] = useState(false);

  const currentStageIndex = stages.indexOf(stage);

  async function loadBillingAddress() {
    const result = await getBillingAddress();
    setBillingAddress(result.data);
    return result.data !== undefined;
  }

  async function loadPaymentDetails() {
    const result = await getDefaultPaymentMethod();
    setPaymentDetails(result.data);
    return result.data !== undefined;
  }

  async function handlePaymentDetailsUpdate(cardId: string) {
    const results = await getPaymentMethods();

    const newPaymentDetails = results.data.find((p) => p.id === cardId);

    if (!newPaymentDetails) {
      return;
    }

    setPaymentDetails(newPaymentDetails);
  }

  async function handleStartSubscription() {
    if (!paymentDetails || !data) {
      return;
    }

    setLoading(true);

    try {
      const { data: response } = await startSubscription(
        data.price.id,
        paymentDetails.id
      );

      if (response.requiresPayment) {
        const { nextAction, clientSecret } = await payInvoice(
          response.requiresPayment.invoiceId
        );
        if (nextAction) {
          const stripe = await stripePromise;
          if (stripe) {
            await stripe.confirmCardPayment(clientSecret).then((result) => {
              if (result.error) {
                console.error(result.error);
              }
            });
          }
        }
      }

      onClose();
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([loadBillingAddress(), loadPaymentDetails()]).then(
      ([address, payment]) => {
        const newStages: typeof stages = [];

        if (!payment) {
          newStages.push("payment");
        }

        if (!address) {
          newStages.push("address");
        }

        newStages.push("confirm");

        setStages(newStages);
        setStage(newStages[0]);
      }
    );
  }, [data]);

  return (
    <Dialog
      open={data !== undefined}
      onClose={onClose}
      transition
      className="fixed inset-0 flex w-screen items-center justify-center bg-base-content/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0 z-50"
    >
      <div className="modal modal-bottom sm:modal-middle modal-open">
        <DialogPanel className="modal-box">
          <ul className="flex gap-2 items-center mb-2">
            {stages.map((s, index) => (
              <li key={s}>
                <button
                  className={clsx("h-2 rounded-full transition-all", {
                    "bg-base-content w-6": s === stage,
                    "bg-base-content/20 w-2": s !== stage,
                  })}
                  disabled={
                    index === currentStageIndex || index > currentStageIndex
                  }
                  onClick={() => setStage(s)}
                />
              </li>
            ))}
          </ul>
          {stage === "address" && (
            <BillingAddressStage
              onAddressUpdated={() => {
                loadBillingAddress();
                setStage(stages[currentStageIndex + 1]);
              }}
            />
          )}
          {stage === "payment" && (
            <NewCardStage
              onCardAdded={() => {
                loadPaymentDetails();
                setStage(stages[currentStageIndex + 1]);
              }}
              onCardSelect={(cardId) => {
                handlePaymentDetailsUpdate(cardId);
                setStage(stages[currentStageIndex + 1]);
              }}
              showExistingCards
            />
          )}
          {stage === "confirm" && (
            <ConfirmStage
              data={data}
              paymentDetails={paymentDetails}
              billingAddress={billingAddress}
              loading={loading}
              onPaymentDetailsUpdate={handlePaymentDetailsUpdate}
              onClose={onClose}
              onStartSubscription={handleStartSubscription}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
