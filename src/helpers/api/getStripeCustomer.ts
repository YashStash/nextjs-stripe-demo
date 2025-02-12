import type { Session } from "next-auth";

import stripe from "./stripeInstance";

export function getStripeCustomerId(session?: Session | null) {
  if (!session?.user) {
    return null;
  }
  const customerId = session.user.stripeCustomerId;

  if (!customerId) {
    return null;
  }

  return customerId;
}

export async function getStripeCustomer(session?: Session | null) {
  const customerId = getStripeCustomerId(session);

  if (!customerId) {
    return null;
  }

  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
    return null;
  }

  return customer;
}
