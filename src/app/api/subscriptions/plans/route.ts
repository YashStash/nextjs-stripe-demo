import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "~/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

function MapPrice(price: Stripe.Price) {
  console.log(price);

  return {
    id: price.id,
    name: price.nickname,
    unitAmount: price.unit_amount,
    currency: price.currency,
    trial: price.metadata?.trial_days
      ? {
          days: Number(price.metadata.trial_days),
        }
      : undefined,
    recurring: price.recurring
      ? {
          interval: price.recurring.interval,
          intervalCount: price.recurring.interval_count,
        }
      : undefined,
  };
}

export const GET = auth(async function GET(req) {
  if (!req.auth?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const products = await stripe.products.list();
  const prices = await stripe.prices.list({ limit: 20 });

  const productsWithPrices = products.data.map((product) => {
    const productPrices = prices.data.filter(
      (price) => price.product === product.id
    );

    if (productPrices.length === 0) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      prices: {
        free: productPrices
          .filter((price) => price.unit_amount === 0)
          .map(MapPrice),
        monthly: productPrices
          .filter(
            (price) =>
              price.recurring?.interval === "month" &&
              Boolean(price.unit_amount)
          )
          .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
          .map(MapPrice),
        yearly: productPrices
          .filter(
            (price) =>
              price.recurring?.interval === "year" && Boolean(price.unit_amount)
          )
          .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
          .map(MapPrice),
        oneTime: productPrices
          .filter((price) => !price.recurring && Boolean(price.unit_amount))
          .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
          .map(MapPrice),
      },
    };
  });

  return NextResponse.json({ data: productsWithPrices.filter(Boolean) });
});
