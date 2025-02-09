import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const GET = auth(async function GET(req) {
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

  const customerPaymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  if (!customerPaymentMethods || customerPaymentMethods.data.length === 0) {
    return NextResponse.json(
      { message: "Customer payment methods not found" },
      { status: 404 }
    );
  }

  const defaultPaymentMethod = customer.invoice_settings.default_payment_method;
  const defaultPaymentMethodDetails =
    customerPaymentMethods.data.find(
      (paymentMethod) => paymentMethod.id === defaultPaymentMethod
    ) ?? customerPaymentMethods.data[0];

  return NextResponse.json({
    data: {
      id: defaultPaymentMethodDetails.id,
      brand: defaultPaymentMethodDetails.card?.brand,
      last4: defaultPaymentMethodDetails.card?.last4,
      expMonth: defaultPaymentMethodDetails.card?.exp_month,
      expYear: defaultPaymentMethodDetails.card?.exp_year,
    },
  });
});

interface DefaultPaymentMethodBody {
  paymentMethodId: string;
}

export const PUT = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const customerId = req.auth.user.stripeCustomerId;

  const body = await req.json();

  const { paymentMethodId } = body as DefaultPaymentMethodBody;

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return NextResponse.json({ message: "Default payment method updated" });
});
