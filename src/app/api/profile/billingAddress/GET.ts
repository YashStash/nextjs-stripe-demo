import { NextResponse } from "next/server";

import { auth } from "~/auth";
import { countryToIsoCode, stateToIsoCode } from "~/helpers/api/countryMappers";
import { getStripeCustomer } from "~/helpers/api/getStripeCustomer";

export const GET = auth(async function GET(req) {
  const customer = await getStripeCustomer(req.auth);

  if (!customer) {
    return NextResponse.json({ message: "No customer found" }, { status: 404 });
  }

  if (!customer.address) {
    return NextResponse.json({ data: null });
  }

  const { country, state, postal_code } = customer.address;

  return NextResponse.json({
    data: {
      country: country ? countryToIsoCode(country) : undefined,
      state: country && state ? stateToIsoCode(country, state) : undefined,
      postCode: postal_code,
    },
  });
});
