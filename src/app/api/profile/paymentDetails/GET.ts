import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomer } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

export const GET = auth(async function GET(req) {
  const customer = await getStripeCustomer(req.auth);

  if (!customer) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const paymentMethods = await stripe.customers.listPaymentMethods(
    customer.id,
    {
      type: "card",
    }
  );

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
