import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface CancelSubscriptionBody {
  subscriptionId: string;
}

export const PUT = auth(async function PUT(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { subscriptionId } = body as CancelSubscriptionBody;

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  if (!subscription) {
    return NextResponse.json(
      { message: "Subscription not found" },
      { status: 404 }
    );
  }

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

  return NextResponse.json({
    message: "Subscription will cancel at billing period end",
  });
});
