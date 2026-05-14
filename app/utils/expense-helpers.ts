export function generateIdempotencyKey() {
  return crypto.randomUUID();
}

export function formatAmountNumber(value: string | number | bigint) {
  return Number(String(value)).toLocaleString("id-ID");
}
