import { signIn } from "~/auth";

export default async function LoginPage() {
  await signIn(undefined, { callbackUrl: "/" });

  return <div>Loading...</div>;
}
