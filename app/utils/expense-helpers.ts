export function formatAmountNumber(value: string | number | bigint) {
  return Number(String(value)).toLocaleString("id-ID");
}
