"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import CheckoutModal from "./CheckoutModal";

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

function getButtonName(price: Price, subscription?: Subscription) {
  if (subscription && ["active", "trialing"].includes(subscription.status)) {
    return "Cancel subscription";
  }

  if (price.trial) {
    return `Start ${price.trial.days}-Day Trial`;
  }

  return price.recurring ? "Subscribe" : "Purchase";
}

export default function Plans() {
  const [plans, setPlans] = useState<Product[]>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>();
  const [checkoutModalData, setCheckoutModalData] = useState<{
    product: Product;
    price: Price;
  }>();
  const [recurringSettings, setRecurringSettings] = useState<
    Record<string, "monthly" | "yearly">
  >({});

  useEffect(() => {
    getPlans().then((result) => setPlans(result.data));
    getSubscriptions().then((result) => setSubscriptions(result.data));
  }, []);

  const handleSubscribe = (product: Product, price: Price) => {
    setCheckoutModalData({ product, price });
  };

  const handleToggleRecurring = (productId: string) => {
    setRecurringSettings((prev) => ({
      ...prev,
      [productId]: prev[productId] === "monthly" ? "yearly" : "monthly",
    }));
  };

  function getPrices(product: Product) {
    return product.prices[recurringSettings[product.id] ?? "monthly"] ?? [];
  }

  return (
    <>
      <ul className="flex flex-col gap-6 max-w-lg">
        {plans?.map((product) => {
          const activeSubscriptions =
            subscriptions?.filter((sub) => sub.productId === product.id) ?? [];

          return (
            <li key={product.id}>
              <div className="flex items-center">
                <h2 className="text-xl mb-2 flex-1">{product.name}</h2>
                <div>
                  <label className="label cursor-pointer gap-2">
                    <span className="label-text">Monthly</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      onChange={() => handleToggleRecurring(product.id)}
                      checked={recurringSettings[product.id] === "yearly"}
                    />
                    <span className="label-text">Yearly</span>
                  </label>
                </div>
              </div>
              <ul className="flex flex-col gap-4">
                {[
                  ...product.prices.oneTime,
                  ...product.prices.free,
                  ...getPrices(product),
                ].map((price) => (
                  <li key={price.id} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h3 className="font-bold">{price.name}</h3>
                      <p>
                        ${price.unitAmount / 100}{" "}
                        <span className="uppercase">{price.currency}</span>
                        {" / "}
                        {price.recurring && Boolean(price.unitAmount) && (
                          <span className="capitalize">
                            Every {price.recurring.interval}
                          </span>
                        )}
                        {!price.recurring && <span>One-Time</span>}
                        {!Boolean(price.unitAmount) && <span>Always</span>}
                      </p>
                      <div className="card-actions justify-end">
                        <button
                          className={clsx("btn", {
                            "btn-primary": price.recurring,
                            "btn-accent": !price.recurring,
                          })}
                          onClick={() => handleSubscribe(product, price)}
                        >
                          {getButtonName(
                            price,
                            activeSubscriptions.find(
                              (sub) => sub.plan.id === price.id
                            )
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
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
    </>
  );
}
