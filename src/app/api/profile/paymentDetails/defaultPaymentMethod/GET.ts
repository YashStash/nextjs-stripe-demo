import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomer } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

export const GET = auth(async function GET(req) {
  const customer = await getStripeCustomer(req.auth);

  if (!customer) {
    return NextResponse.json(
      { message: "Customer not found" },
      { status: 404 }
    );
  }

  const customerPaymentMethods = await stripe.paymentMethods.list({
    customer: customer.id,
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
