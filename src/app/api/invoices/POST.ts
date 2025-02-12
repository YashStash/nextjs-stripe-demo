import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import getStripeRecordId from "~/helpers/api/getStripeRecordId";
import stripe from "~/helpers/api/stripeInstance";

interface PayInvoiceBody {
  invoiceId: string;
}

export const POST = auth(async function POST(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { invoiceId } = body as PayInvoiceBody;

  if (!invoiceId) {
    return NextResponse.json(
      { message: "Missing required parameter 'invoiceId'" },
      { status: 400 }
    );
  }

  const invoice = await stripe.invoices.retrieve(invoiceId);

  if (!invoice || !invoice.payment_intent) {
    return NextResponse.json(
      { message: "Invoice not found or missing payment intent" },
      { status: 404 }
    );
  }

  const paymentIntentId = getStripeRecordId(invoice.payment_intent);

  if (paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (
      paymentIntent.status === "requires_action" &&
      paymentIntent.next_action
    ) {
      return NextResponse.json({
        message: "Payment requires additional authentication",
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      });
    } else if (paymentIntent.status === "succeeded") {
      if (paymentIntent.payment_method) {
        const invoicePayResponse = await stripe.invoices.pay(invoiceId, {
          payment_method:
            typeof paymentIntent.payment_method === "string"
              ? paymentIntent.payment_method
              : paymentIntent.payment_method.id,
        });

        if (invoicePayResponse.status !== "paid") {
          return NextResponse.json(
            { message: "Payment failed", paymentIntent },
            { status: 400 }
          );
        }
      }
      return NextResponse.json({ message: "Payment successful" });
    } else {
      return NextResponse.json(
        { message: "Payment failed", paymentIntent },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { message: "No payment intent found for this invoice" },
    { status: 400 }
  );
});
