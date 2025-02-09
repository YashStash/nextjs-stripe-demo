import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "@qctrl/elements-css";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
  }
  interface Account {
    expires_in: number;
    refresh_expires_in: number;
  }
  interface Session {
    accessToken: string;
    expires_at: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    access_token: string;
    expires_at: number;
    refresh_token?: string;
    refresh_expires_at?: number;
  }
}
