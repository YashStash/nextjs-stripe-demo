// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { User } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `Provider` React Context
   */
  interface Session {
    accessToken?: string;
    error?: string;
    stripeCustomerId: string;
  }
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface User {
    sub: string;
    email_verified: boolean;
    name: string;
    telephone: string;
    preferred_username: string;
    org_name: string;
    given_name: string;
    family_name: string;
    email: string;
    id: string;
    stripeCustomerId: string;
  }
  /**
   * Usually contains information about the provider being used
   * and also extends `TokenSet`, which is different tokens returned by OAuth Providers.
   */
  interface Account {
    provider: string;
    id: string;
    accessToken: string;
    accessTokenExpires?: number;
    refreshToken: string;
    idToken: string;
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    id_token: string;
    "not-before-policy": number;
    session_state: string;
    scope: string;
  }
  /** The OAuth profile returned from your provider */
  interface Profile {
    email_verified: boolean;
    telephone: string;
    preferred_username: string;
    org_name: string;
    given_name: string;
    family_name: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    refresh_expires_at: number;
    error?: string;
    stripeCustomerId: string;
  }
}
