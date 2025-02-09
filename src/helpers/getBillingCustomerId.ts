import { jwtDecode } from "jwt-decode";

export default function getBillingCustomerId(accessToken: string) {
  const decoded = jwtDecode<{ billing_customer_id: string }>(accessToken);

  console.log(decoded.billing_customer_id);

  return decoded.billing_customer_id;
}
