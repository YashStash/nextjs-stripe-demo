import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

export const GET = auth(async function GET(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

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
