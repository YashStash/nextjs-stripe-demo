import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomer } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface CreateSubscriptionBody {
  priceId: string;
  defaultPaymentMethodId: string;
}

export const POST = auth(async function POST(req) {
  const customer = await getStripeCustomer(req.auth);

  if (!customer) {
    return NextResponse.json(
      { message: "Customer not found" },
      { status: 404 }
    );
  }

  const body = await req.json();

  const { priceId, defaultPaymentMethodId } = body as CreateSubscriptionBody;

  const price = await stripe.prices.retrieve(priceId);

  if (!price) {
    return NextResponse.json({ message: "Price not found" }, { status: 404 });
  }

  const product = await stripe.products.retrieve(
    typeof price.product === "string" ? price.product : price.product.id
  );

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  if (
    customer.metadata.life_time_access &&
    customer.metadata.life_time_access.split(",").includes(product.name)
  ) {
    return NextResponse.json(
      { message: "Customer already has lifetime access" },
      { status: 400 }
    );
  }

  const otherSubscriptions = await stripe.subscriptions.list({
    customer: customer.id,
  });

  const hasCurrentProductSubscription = otherSubscriptions.data.some(
    (subscription) =>
      subscription.items.data.some(
        (item) => item.price.product === price.product
      )
  );

  if (hasCurrentProductSubscription) {
    return NextResponse.json(
      { message: "You already have a subscription to this product" },
      { status: 400 }
    );
  }

  const trial = price.metadata?.trial_days;

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      {
        price: priceId,
      },
    ],
    trial_end: trial
      ? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * Number(trial)
      : undefined,
    default_payment_method: defaultPaymentMethodId,
    off_session: true,
  });

  const subscriptionInvoiceId =
    subscription.latest_invoice &&
    (typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : subscription.latest_invoice.id);

  if (subscriptionInvoiceId) {
    const invoice = await stripe.invoices.retrieve(subscriptionInvoiceId);

    if (invoice.status === "open") {
      return NextResponse.json({
        data: { success: true, requiresPayment: { invoiceId: invoice.id } },
      });
    }
  }

  return NextResponse.json({
    data: { success: subscription.status === "active" },
  });
});
