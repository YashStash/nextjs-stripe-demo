import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ["card"],
    customer: customerId,
  });

  return NextResponse.json({
    data: { id: setupIntent.id, clientSecret: setupIntent.client_secret },
  });
});
