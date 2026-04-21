import dayjs from "dayjs";
import type { DeliveryStatus, PaymentStatus, Role } from "../types/domain";

export function formatDate(value?: string | null, pattern = "DD MMM YYYY") {
  if (!value) {
    return "-";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "-";
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, "DD MMM YYYY, HH:mm");
}

export function formatDecimal(value?: string | number | null, suffix = "") {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return `${value}${suffix}`;
}

export function formatKg(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const raw = String(value).replace(/,/g, "").trim();
  const normalized = Number(raw);
  if (Number.isNaN(normalized)) {
    return "-";
  }

  // Keep numeric value intact while hiding trailing decimal zeros for cleaner UI.
  let display = raw
    .replace(/^(-?)0+(?=\d)/, "$1")
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");

  if (display === "" || display === "-") {
    display = String(normalized);
  }

  if (display.startsWith(".")) {
    display = `0${display}`;
  }

  if (display.startsWith("-.")) {
    display = `-0${display.slice(1)}`;
  }

  return display === "-0" ? "0" : display;
}

export function formatRupiah(value?: string | number | bigint | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const normalized =
    typeof value === "bigint"
      ? value.toString()
      : String(value).replace(/,/g, "");

  return `Rp ${Number(normalized).toLocaleString("id-ID")}`;
}

export function roleLabel(role: Role) {
  return {
    ADMIN: "Admin",
    OWNER: "Owner",
    OPERATOR: "Operator",
  }[role];
}

export function deliveryStatusLabel(status: DeliveryStatus) {
  return {
    BELUM_DIHANTAR: "Belum Dihantar",
    SEDANG_DIHANTAR: "Sedang Dihantar",
    SUDAH_DIHANTAR: "Sudah Dihantar",
  }[status];
}

export function paymentStatusLabel(status: PaymentStatus) {
  return {
    BELUM_BAYAR: "Belum Bayar",
    DP: "DP",
    LUNAS: "Lunas",
  }[status];
}

export function isoDate(value: string | Date) {
  return dayjs(value).format("YYYY-MM-DD");
}
