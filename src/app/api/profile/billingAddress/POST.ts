import { NextResponse } from "next/server";

import { auth } from "~/auth";
import {
  countryToIsoCode,
  isoCodeToCountry,
  isoCodeToState,
  stateToIsoCode,
} from "~/helpers/api/countryMappers";
import { getStripeCustomerId } from "~/helpers/api/getStripeCustomer";
import stripe from "~/helpers/api/stripeInstance";

interface BillingAddress {
  country: string;
  state: string;
  postCode: string;
}

export const POST = auth(async function POST(req) {
  const customerId = getStripeCustomerId(req.auth);

  if (!customerId) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  const body = await req.json();

  const { country, state, postCode } = body as BillingAddress;

  if (!country || !state || !postCode) {
    return NextResponse.json(
      { message: "Country, state and post code are required" },
      { status: 400 }
    );
  }

  const customer = await stripe.customers.update(customerId, {
    address: {
      country: isoCodeToCountry(country),
      state: isoCodeToState(country, state),
      postal_code: postCode,
    },
  });

  const newAddress = customer.address;

  if (!newAddress) {
    return NextResponse.json({ data: null });
  }

  if (!newAddress.country || !newAddress.state || !newAddress.postal_code) {
    return NextResponse.json(
      { message: "Failed to update billing address" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      country: countryToIsoCode(newAddress.country),
      state: stateToIsoCode(newAddress.country, newAddress.state),
      postCode: newAddress.postal_code,
    },
  });
});
