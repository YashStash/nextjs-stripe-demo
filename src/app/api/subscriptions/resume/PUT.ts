import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface ResumeSubscriptionBody {
  subscriptionId: string;
}

export const PUT = auth(async function PUT(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { subscriptionId } = body as ResumeSubscriptionBody;

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  if (!subscription) {
    return NextResponse.json(
      { message: "Subscription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Subscription resumed",
  });
});
