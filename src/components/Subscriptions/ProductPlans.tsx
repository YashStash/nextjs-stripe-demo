import clsx from "clsx";

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

interface ProductPlansProps {
  product: Product;
  recurringSettings: Record<string, "monthly" | "yearly">;
  subscriptions: Subscription[];
  handleToggleRecurring: (productId: string) => void;
  setAreYouSureDialogData: React.Dispatch<
    React.SetStateAction<Subscription | undefined>
  >;
  setPlans: React.Dispatch<React.SetStateAction<Product[] | undefined>>;
  setSubscriptions: React.Dispatch<
    React.SetStateAction<Subscription[] | undefined>
  >;
  resumeSubscription: (subscriptionId: string) => void;
  subscribe: (
    product: Product,
    price: Price,
    currentSubscriptionId?: string,
    upgrade?: boolean
  ) => void;
}

export default function ProductPLans({
  product,
  recurringSettings,
  subscriptions,
  handleToggleRecurring,
  setAreYouSureDialogData,
  resumeSubscription,
  subscribe,
}: ProductPlansProps) {
  const activeSubscriptions =
    subscriptions?.filter((sub) => sub.productId === product.id) ?? [];

  const lowestActiveSubscription = activeSubscriptions.reduce(
    (lowest, sub) => {
      if (lowest.plan.unitAmount === 0) {
        return lowest;
      }

      if (sub.plan.unitAmount < lowest.plan.unitAmount) {
        return sub;
      }

      return lowest;
    },
    activeSubscriptions[0] ?? {
      plan: {
        unitAmount: Infinity,
      },
    }
  );
  const highestActiveSubscription = activeSubscriptions.reduce(
    (highest, sub) => {
      if (sub.plan.unitAmount > highest.plan.unitAmount) {
        return sub;
      }

      return highest;
    },
    activeSubscriptions[0] ?? {
      plan: {
        unitAmount: 0,
      },
    }
  );

  function getPrices(product: Product) {
    return product.prices[recurringSettings[product.id] ?? "monthly"] ?? [];
  }

  function getButtonName(price: Price, subscription?: Subscription) {
    if (subscription) {
      if (subscription.cancelAtPeriodEnd) {
        return {
          color: "btn-primary",
          label: "Resume subscription",
        };
      }

      if (["active", "trialing"].includes(subscription.status)) {
        return {
          color: "btn-error",
          label: "Cancel subscription",
        };
      }
    }

    if (activeSubscriptions.length > 0 && price.recurring) {
      if (price.unitAmount < lowestActiveSubscription.plan.unitAmount) {
        return {
          color: "btn-neutral",
          label: "Downgrade",
        };
      }

      if (price.unitAmount > highestActiveSubscription.plan.unitAmount) {
        if (price.trial) {
          return {
            color: "btn-primary",
            label: `Upgrade Start ${price.trial.days}-Day Trial`,
          };
        }

        return {
          color: "btn-primary",
          label: "Upgrade",
        };
      }
    }

    if (price.trial) {
      return {
        color: "btn-primary",
        label: `Start ${price.trial.days}-Day Trial`,
      };
    }

    return price.recurring
      ? {
          color: "btn-primary",
          label: "Subscribe",
        }
      : {
          color: "btn-accent",
          label: "Purchase",
        };
  }

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
        ].map((price) => {
          const callToActionLabel = getButtonName(
            price,
            activeSubscriptions.find((sub) => sub.plan.id === price.id)
          );

          function callToActionClick() {
            if (callToActionLabel.label === "Cancel subscription") {
              setAreYouSureDialogData(
                activeSubscriptions.find((sub) => sub.plan.id === price.id)
              );
            } else if (callToActionLabel.label === "Resume subscription") {
              resumeSubscription(
                activeSubscriptions.find((sub) => sub.plan.id === price.id)
                  ?.id ?? ""
              );
            } else {
              if (activeSubscriptions.length > 0) {
                subscribe(
                  product,
                  price,
                  activeSubscriptions.length > 0
                    ? highestActiveSubscription.id
                    : "",
                  callToActionLabel.label === "Upgrade"
                );
              } else {
                subscribe(product, price);
              }
            }
          }

          return (
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
                    className={clsx("btn", callToActionLabel.color)}
                    onClick={callToActionClick}
                  >
                    {callToActionLabel.label}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
