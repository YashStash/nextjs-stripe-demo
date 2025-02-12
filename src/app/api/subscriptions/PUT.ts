import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface UpdateSubscriptionBody {
  subscriptionId: string;
  newPriceId: string;
}

export const PUT = auth(async function PUT(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { subscriptionId, newPriceId } = body as UpdateSubscriptionBody;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (!subscription || subscription.items.data.length === 0) {
    return NextResponse.json(
      { message: "Subscription not found" },
      { status: 404 }
    );
  }

  const firstItem = subscription.items.data[0];
  const currentPrice = firstItem.price;
  const isUpgrade = newPriceId > currentPrice.id;

  if (isUpgrade) {
    const subscriptionSchedules = await stripe.subscriptionSchedules.list({
      customer: customerId,
    });

    const currentSubscriptionSchedule = subscriptionSchedules.data.find(
      (schedule) =>
        !!schedule.subscription &&
        (typeof schedule.subscription === "string"
          ? schedule.subscription === subscription.id
          : schedule.subscription.id === subscription.id)
    );

    if (currentSubscriptionSchedule) {
      await stripe.subscriptionSchedules.cancel(currentSubscriptionSchedule.id);
    }

    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      items: [{ id: firstItem.id, price: newPriceId }],
      proration_behavior: "always_invoice",
      off_session: true,
    });

    return NextResponse.json({
      message: "Subscription upgraded successfully!",
    });
  }

  const customersSubscriptionSchedule = await stripe.subscriptionSchedules.list(
    {
      customer: customerId,
    }
  );

  const subscriptionSchedule = customersSubscriptionSchedule.data.find(
    (schedule) =>
      !!schedule.subscription &&
      (typeof schedule.subscription === "string"
        ? schedule.subscription === subscription.id
        : schedule.subscription.id === subscription.id)
  );

  if (!subscriptionSchedule) {
    await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
      phases: [
        {
          items: [
            {
              price: currentPrice.id,
              quantity: 1,
            },
          ],
          end_date: subscription.current_period_end,
        },
        {
          items: [
            {
              price: newPriceId,
              quantity: 1,
            },
          ],
        },
      ],
    });
  } else {
    await stripe.subscriptionSchedules.update(subscriptionSchedule.id, {
      phases: [
        {
          items: [
            {
              price: currentPrice.id,
              quantity: 1,
            },
          ],
          end_date: subscription.current_period_end,
        },
        {
          items: [
            {
              price: newPriceId,
              quantity: 1,
            },
          ],
        },
      ],
    });
  }

  return NextResponse.json({
    message: "Subscription downgraded successfully!",
  });
});
