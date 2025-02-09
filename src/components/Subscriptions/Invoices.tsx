"use client";

import {
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/20/solid";
import { loadStripe } from "@stripe/stripe-js";
import clsx from "clsx";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface Invoice {
  id: string;
  amountDue: number;
  currency: string;
  date: number;
  status:
    | "draft"
    | "open"
    | "paid"
    | "uncollectible"
    | "void"
    | "marked_uncollectible";
  pdf: string;
}

async function getInvoices(): Promise<{ data: Invoice[] }> {
  return fetch("/api/invoices").then((res) => res.json());
}

async function payInvoice(invoiceId: string) {
  return fetch("/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceId }),
  }).then((res) => res.json());
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>();

  useEffect(() => {
    getInvoices().then((result) => setInvoices(result.data));
  }, []);

  const handlePayInvoice = async (invoiceId: string) => {
    const { nextAction, clientSecret } = await payInvoice(invoiceId);
    if (nextAction) {
      const stripe = await stripePromise;
      if (stripe) {
        stripe.confirmCardPayment(clientSecret).then((result) => {
          if (result.error) {
            console.error(result.error);
          } else {
            getInvoices().then((result) => setInvoices(result.data));
          }
        });
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices?.map((invoice) => (
            <tr key={invoice.id}>
              <td>{new Date(invoice.date * 1000).toLocaleDateString()}</td>
              <td>
                ${invoice.amountDue / 100} {invoice.currency.toUpperCase()}
              </td>
              <td>
                <p
                  className={clsx("badge capitalize", {
                    "badge-primary": invoice.status === "open",
                    "badge-success": invoice.status === "paid",
                    "badge-error": invoice.status === "uncollectible",
                    "badge-warning": invoice.status === "void",
                    "badge-accent": invoice.status === "marked_uncollectible",
                  })}
                >
                  {invoice.status}
                </p>
              </td>
              <td>
                {invoice.status === "open" && (
                  <button
                    className="btn btn-ghost btn-circle btn-sm"
                    onClick={() => handlePayInvoice(invoice.id)}
                  >
                    <CurrencyDollarIcon className="w-4 h-4" />
                  </button>
                )}
                <a
                  href={invoice.pdf}
                  className="btn btn-ghost btn-circle btn-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
