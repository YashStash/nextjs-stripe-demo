"use client";

import { useEffect, useState } from "react";
import CheckoutModal from "./CheckoutModal";
import AreYouSureDialog from "../AreYouSureDialog";
import ProductPLans from "./ProductPlans";

interface Price {
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
}

interface Product {
  id: string;
  name: string;
  prices: {
    free: Price[];
    monthly: Price[];
    yearly: Price[];
    oneTime: Price[];
  };
}

interface Subscription {
  id: string;
  status:
    | "active"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "trialing"
    | "unpaid";
  cancelAtPeriodEnd: boolean;
  current_period_end: number;
  current_period_start: number;
  productId: string;
  plan: Price;
}

async function getPlans(): Promise<{ data: Product[] }> {
  return fetch("/api/subscriptions/plans").then((res) => res.json());
}

async function getSubscriptions(): Promise<{ data: Subscription[] }> {
  return fetch("/api/subscriptions").then((res) => res.json());
}

async function cancelSubscription(subscriptionId: string) {
  return fetch(`/api/subscriptions/cancel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscriptionId }),
  }).then((res) => res.json());
}

async function resumeSubscription(subscriptionId: string) {
  return fetch(`/api/subscriptions/resume`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscriptionId }),
  }).then((res) => res.json());
}

export default function Plans() {
  const [plans, setPlans] = useState<Product[]>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>();
  const [checkoutModalData, setCheckoutModalData] = useState<{
    product: Product;
    price: Price;
    currentSubscriptionId?: string;
    upgrade?: boolean;
  }>();
  const [recurringSettings, setRecurringSettings] = useState<
    Record<string, "monthly" | "yearly">
  >({});
  const [areYouSureDialogData, setAreYouSureDialogData] =
    useState<Subscription>();

  useEffect(() => {
    getPlans().then((result) => setPlans(result.data));
    getSubscriptions().then((result) => setSubscriptions(result.data));
  }, []);

  const handleSubscribe = (
    product: Product,
    price: Price,
    currentSubscriptionId?: string,
    upgrade?: boolean
  ) => {
    setCheckoutModalData({ product, price, currentSubscriptionId, upgrade });
  };

  const handleResumeSubscription = (subscriptionId: string) => {
    resumeSubscription(subscriptionId).then(() => {
      getPlans().then((result) => setPlans(result.data));
      getSubscriptions().then((result) => setSubscriptions(result.data));
    });
  };

  const handleToggleRecurring = (productId: string) => {
    setRecurringSettings((prev) => ({
      ...prev,
      [productId]: prev[productId] === "monthly" ? "yearly" : "monthly",
    }));
  };

  return (
    <>
      <ul className="flex flex-col gap-6 max-w-lg">
        {plans?.map((product) => (
          <ProductPLans
            key={product.id}
            product={product}
            recurringSettings={recurringSettings}
            subscriptions={subscriptions ?? []}
            handleToggleRecurring={handleToggleRecurring}
            setAreYouSureDialogData={setAreYouSureDialogData}
            setPlans={setPlans}
            setSubscriptions={setSubscriptions}
            resumeSubscription={handleResumeSubscription}
            subscribe={handleSubscribe}
          />
        ))}
        {!plans && <li>Loading...</li>}
      </ul>
      <CheckoutModal
        onClose={() => {
          setCheckoutModalData(undefined);
          getPlans().then((result) => setPlans(result.data));
          getSubscriptions().then((result) => setSubscriptions(result.data));
        }}
        data={checkoutModalData}
      />
      <AreYouSureDialog
        open={!!areYouSureDialogData}
        loading={false}
        description="Are you sure you want to cancel your plan?"
        callToActionLabel="Cancel Plan"
        onClose={() => setAreYouSureDialogData(undefined)}
        onCallToAction={() => {
          if (areYouSureDialogData) {
            cancelSubscription(areYouSureDialogData.id).then(() => {
              setAreYouSureDialogData(undefined);
              getPlans().then((result) => setPlans(result.data));
              getSubscriptions().then((result) =>
                setSubscriptions(result.data)
              );
            });
          }
        }}
      />
    </>
  );
}
