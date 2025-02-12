import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomer } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

export const DELETE = auth(async function DELETE(req) {
  const customer = await getStripeCustomer(req.auth);

  if (!customer) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const itemId = searchParams.get("id");

  if (!itemId) {
    return NextResponse.json(
      { message: "Payment method ID is required" },
      { status: 400 }
    );
  }

  if (customer.invoice_settings.default_payment_method === itemId) {
    const customerPaymentMethods = await stripe.customers.listPaymentMethods(
      customer.id,
      { type: "card" }
    );

    const otherPaymentMethod = customerPaymentMethods.data.find(
      (paymentMethod) => paymentMethod.id !== itemId
    );

    if (otherPaymentMethod) {
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: otherPaymentMethod.id,
        },
      });
    }
  }

  await stripe.paymentMethods.detach(itemId);

  return NextResponse.json({ message: "Payment method deleted" });
});
