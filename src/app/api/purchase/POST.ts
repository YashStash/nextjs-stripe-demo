import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomer } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface PurchaseBody {
  priceId: string;
  defaultPaymentMethod: string;
}

export const POST = auth(async function POST(req) {
  const customer = await getStripeCustomer(req.auth);

  if (!customer) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { priceId, defaultPaymentMethod } = body as PurchaseBody;

  if (!priceId) {
    return NextResponse.json(
      { message: "Missing required parameter 'priceId'" },
      { status: 400 }
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
    customer: customer.id,
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
    customer: customer.id,
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

  await stripe.customers.update(customer.id, {
    metadata: {
      life_time_access: customer.metadata.life_time_access
        ? `${customer.metadata.life_time_access},${productName}`
        : productName,
    },
  });

  return NextResponse.json({ message: "Purchase successful" });
});
