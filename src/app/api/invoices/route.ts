import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const customerId = req.auth.user.stripeCustomerId;

  const invoices = await stripe.invoices.list({
    customer: customerId,
  });

  if (invoices.data.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const formattedInvoices = invoices.data
    .filter((invoice) => invoice.lines.data.length)
    .map((invoice) => {
      console.log(invoice);
      return {
        id: invoice.id,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        date: invoice.created,
        status: invoice.status,
        paymentIntentId: invoice.payment_intent
          ? typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : invoice.payment_intent.id
          : undefined,
        pdf: invoice.invoice_pdf,
      };
    });

  return NextResponse.json({ data: formattedInvoices });
});

interface PayInvoiceBody {
  invoiceId: string;
}

export const POST = auth(async function POST(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
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
  const paymentIntentId = invoice.payment_intent
    ? typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent.id
    : undefined;

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

  return NextResponse.json({ message: "Payment successful" });
});
