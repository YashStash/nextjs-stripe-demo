import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const customerId = req.auth.user.stripeCustomerId;

  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ["card"],
    customer: customerId,
  });

  return NextResponse.json({
    data: { id: setupIntent.id, clientSecret: setupIntent.client_secret },
  });
});
