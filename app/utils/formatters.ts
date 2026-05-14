import dayjs from "dayjs";
import type { DeliveryStatus, PaymentStatus, Role } from "../types/domain";
import { getCurrentLanguage, translateMessage } from "./i18n";

export function formatDate(value?: string | null, pattern = "DD MMM YYYY") {
  if (!value) {
    return "-";
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return "-";
  }

  const language = getCurrentLanguage();
  const locale = language === "id" ? "id-ID" : "en-US";
  const date = parsed.toDate();

  if (pattern === "dddd, DD MMM YYYY") {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (pattern === "DD MMM YYYY, HH:mm") {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: language === "id" ? "h23" : "h12",
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

export function formatMoneyNumber(
  value?: string | number | null,
  language: "id" | "en" = getCurrentLanguage(),
) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const normalized = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(normalized)) {
    return "-";
  }

  return normalized.toLocaleString(language === "en" ? "en-US" : "id-ID");
}

export function roleLabel(role: Role) {
  return translateMessage(getCurrentLanguage(), `role.${role}`);
}

export function deliveryStatusLabel(status: DeliveryStatus) {
  return translateMessage(getCurrentLanguage(), `status.delivery.${status}`);
}

export function paymentStatusLabel(status: PaymentStatus) {
  return translateMessage(getCurrentLanguage(), `status.payment.${status}`);
}

export function isoDate(value: string | Date) {
  return dayjs(value).format("YYYY-MM-DD");
}
