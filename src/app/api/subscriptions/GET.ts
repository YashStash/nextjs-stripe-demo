import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

export const GET = auth(async function GET(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const customerSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });

  if (customerSubscriptions.data.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const subscriptions = customerSubscriptions.data.map((subscription) => {
    const price = subscription.items.data[0].price;

    return {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
      currentPeriodStart: subscription.current_period_start,
      productId: price.product,
      plan: {
        id: price.id,
        name: price.nickname,
        unitAmount: price.unit_amount,
        currency: price.currency,
        trial: price.metadata.trial_days && {
          days: Number(price.metadata.trial_days),
        },
        recurring: price.recurring
          ? {
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count,
            }
          : null,
      },
    };
  });

  return NextResponse.json({ data: subscriptions });
});
