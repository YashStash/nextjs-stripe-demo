import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        const stripeCustomer = await stripe.customers.search({
          query: `email:"${user.email}"`,
        });

        if (stripeCustomer.data.length) {
          token.stripeCustomerId = stripeCustomer.data[0].id;
        } else {
          const stripeCustomer = await stripe.customers.create({
            email: user.email,
          });
          token.stripeCustomerId = stripeCustomer.id;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.stripeCustomerId = token.stripeCustomerId;
      return session;
    },
  },
});
