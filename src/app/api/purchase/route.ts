import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

interface PurchaseBody {
  priceId: string;
  defaultPaymentMethod: string;
}

export const POST = auth(async function POST(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const customerId = req.auth.user.stripeCustomerId;

  const body = await req.json();

  const { priceId, defaultPaymentMethod } = body as PurchaseBody;

  if (!priceId) {
    return NextResponse.json(
      { message: "Missing required parameter 'priceId'" },
      { status: 400 }
    );
  }

  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
    return NextResponse.json(
      { message: "Customer not found" },
      { status: 404 }
    );
  }

  const price = await stripe.prices.retrieve(priceId);

  if (!price || !price.unit_amount) {
    return NextResponse.json({ message: "Price not found" }, { status: 404 });
  }

  const productName =
    typeof price.product === "string" ? price.product : price.product.id;

  if (
    customer.metadata.life_time_access &&
    customer.metadata.life_time_access.split(",").includes(productName)
  ) {
    return NextResponse.json(
      { message: "Customer already has lifetime access" },
      { status: 400 }
    );
  }

  const customerSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });

  const currentProductSubscriptions = customerSubscriptions.data.filter(
    (subscription) =>
      subscription.items.data.some(
        (item) => item.price.product === price.product
      )
  );

  const PaymentIntent = await stripe.paymentIntents.create({
    amount: price.unit_amount,
    currency: price.currency,
    customer: customerId,
    payment_method: defaultPaymentMethod,
    off_session: true,
    confirm: true,
  });

  if (PaymentIntent.status !== "succeeded") {
    return NextResponse.json({ message: "Payment failed" }, { status: 400 });
  }

  if (currentProductSubscriptions.length > 0) {
    currentProductSubscriptions.forEach(async (subscription) => {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
    });
  }

  await stripe.customers.update(customerId, {
    metadata: {
      life_time_access: customer.metadata.life_time_access
        ? `${customer.metadata.life_time_access},${productName}`
        : productName,
    },
  });

  return NextResponse.json({ message: "Purchase successful" });
});
