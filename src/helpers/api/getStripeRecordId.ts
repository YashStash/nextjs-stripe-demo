export default function getStripeRecordId(record: { id: string } | string) {
  if (typeof record === "string") {
    return record;
  }
  return record.id;
}
