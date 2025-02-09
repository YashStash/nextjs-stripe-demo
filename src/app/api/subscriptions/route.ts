import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const customerId = req.auth.user.stripeCustomerId;

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

interface CreateSubscriptionBody {
  priceId: string;
  defaultPaymentMethodId: string;
}

export const POST = auth(async function POST(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const customerId = req.auth.user.stripeCustomerId;

  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
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
    customer: customerId,
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
    customer: customerId,
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

interface UpdateSubscriptionBody {
  subscriptionId: string;
  newPriceId: string;
}

export const PUT = auth(async function PUT(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const customerId = req.auth.user.stripeCustomerId;

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
