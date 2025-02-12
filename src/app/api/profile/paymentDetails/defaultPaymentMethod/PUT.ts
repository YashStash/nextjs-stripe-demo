import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface DefaultPaymentMethodBody {
  paymentMethodId: string;
}

export const PUT = auth(async function GET(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { paymentMethodId } = body as DefaultPaymentMethodBody;

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return NextResponse.json({ message: "Default payment method updated" });
});
