import { auth } from "~/auth";
import BillingAddress from "~/components/BillingAddress";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl mb-6">Profile</h1>
      <BillingAddress />
    </div>
  );
}
