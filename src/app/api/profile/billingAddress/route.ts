import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Country, State } from "country-state-city";

import { auth } from "~/auth";

const allCountries = Country.getAllCountries();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

interface BillingAddress {
  country: string;
  state: string;
  postCode: string;
}

function countryToIsoCode(country: string) {
  const selectedCountry = allCountries.find((c) => c.name === country);
  return selectedCountry?.isoCode;
}

function stateToIsoCode(country: string, state: string) {
  const selectedCountry = allCountries.find((c) => c.name === country);
  const selectedState = State.getStatesOfCountry(selectedCountry?.isoCode).find(
    (s) => s.name === state
  );
  return selectedState?.isoCode;
}

function isoCodeToCountry(isoCode: string) {
  const selectedCountry = allCountries.find((c) => c.isoCode === isoCode);
  return selectedCountry?.name;
}

function isoCodeToState(countryIsoCode: string, isoCode: string) {
  const selectedState = State.getStateByCodeAndCountry(isoCode, countryIsoCode);
  return selectedState?.name;
}

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const customerId = req.auth.user.stripeCustomerId;

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted) {
    if (!customer.address) {
      return NextResponse.json({ data: null });
    }

    const { country, state, postal_code } = customer.address;

    if (!country || !state || !postal_code) {
      return NextResponse.json({ data: null });
    }

    console.log("country", country);
    console.log("state", state);
    console.log("postal_code", postal_code);

    return NextResponse.json({
      data: {
        country: countryToIsoCode(country),
        state: stateToIsoCode(country, state),
        postCode: postal_code,
      },
    });
  }

  return NextResponse.json({ message: "Customer not found" }, { status: 404 });
});

export const POST = auth(async function POST(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const customerId = req.auth.user.stripeCustomerId;

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
