import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const customerId = req.auth.user.stripeCustomerId;

  const paymentMethods = await stripe.customers.listPaymentMethods(customerId, {
    type: "card",
  });

  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
    return NextResponse.json(
      { message: "Customer not found" },
      { status: 404 }
    );
  }

  if (paymentMethods.data.length === 0) {
    return NextResponse.json({ data: [] });
  }

  return NextResponse.json({
    data: paymentMethods.data.map((paymentMethod) => {
      return {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
        default:
          customer.invoice_settings.default_payment_method === paymentMethod.id,
      };
    }),
  });
});

export const DELETE = auth(async function DELETE(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const itemId = searchParams.get("id");

  if (!itemId) {
    return NextResponse.json(
      { message: "Payment method ID is required" },
      { status: 400 }
    );
  }
  const customerId = req.auth.user.stripeCustomerId;

  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
    return NextResponse.json(
      { message: "Customer not found" },
      { status: 404 }
    );
  }

  if (customer.invoice_settings.default_payment_method === itemId) {
    const customerPaymentMethods = await stripe.customers.listPaymentMethods(
      customerId,
      { type: "card" }
    );

    const otherPaymentMethod = customerPaymentMethods.data.find(
      (paymentMethod) => paymentMethod.id !== itemId
    );

    if (otherPaymentMethod) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: otherPaymentMethod.id,
        },
      });
    }
  }

  await stripe.paymentMethods.detach(itemId);

  return NextResponse.json({ message: "Payment method deleted" });
});
