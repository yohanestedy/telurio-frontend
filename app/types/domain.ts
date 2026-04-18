export const roles = ["ADMIN", "OWNER", "OPERATOR"] as const;
export type Role = (typeof roles)[number];

export const deliveryStatuses = [
  "BELUM_DIHANTAR",
  "SEDANG_DIHANTAR",
  "SUDAH_DIHANTAR",
] as const;
export type DeliveryStatus = (typeof deliveryStatuses)[number];

export const paymentStatuses = ["BELUM_BAYAR", "DP", "LUNAS"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const paymentMethods = ["CASH", "TRANSFER"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const orderLifecycleStatuses = ["ACTIVE", "CANCELLED"] as const;
export type OrderLifecycleStatus = (typeof orderLifecycleStatuses)[number];

export interface CoopAccess {
  coopId: string;
  coopName: string;
  ownershipSharePercent: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
  coopAccesses: CoopAccess[];
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export type SortOrder = "asc" | "desc";

export type PaginationFilters = Record<string, unknown>;

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sortBy: string;
  order: SortOrder;
  filters: PaginationFilters;
}

export interface UserItem {
  id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  coopAccesses: CoopAccess[];
}

export interface CoopItem {
  id: string;
  name: string;
  population: number;
  chickenStrain: string | null;
  chickBirthDate: string | null;
  depreciationPercent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomerItem {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  quantityKg: string;
  pricePerKg: string | null;
  totalInvoice: string | null;
  deliveryDate: string;
  deliverBefore: string | null;
  lifecycleStatus: OrderLifecycleStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  dpAmount: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface AllocationItem {
  id: string;
  coopId: string;
  coopName: string;
  quantityKg: string;
  assignedByName: string | null;
  createdAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amountPaid: string | null;
  notes: string | null;
  updatedById: string;
  updatedByName: string | null;
  createdAt: string;
}

export interface ProductionItem {
  id: string;
  date: string;
  coopId: string;
  coopName: string;
  collectionTime: string;
  goodKg: string;
  goodCount: number;
  brokenCount: number | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface ExpenseCategoryItem {
  id: string;
  name: string;
  isActive: boolean;
  ownerName: string;
}

export interface ExpenseItem {
  id: string;
  date: string;
  coopId: string;
  coopName: string;
  // categoryLabel removed
  expenseCategoryId: string | null;
  expenseCategoryName?: string | null;
  description: string | null;
  amount: string;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface PriceItem {
  id: string;
  effectiveDate: string;
  pricePerKg: string;
  notes: string | null;
  updatedByName: string | null;
}

export interface GrossIncomeItem {
  coopId: string;
  coopName: string;
  totalDeliveredKg: string;
  avgPricePerKg: number;
  grossIncome: string;
  month: number;
  year: number;
}

export interface LiveStockCoopItem {
  coopId: string;
  coopName: string;
  availableKg: string;
  todayInKg: string;
  todayOutKg: string;
  updatedAt: string | null;
}

export interface LiveStockResponse {
  asOfDate: string;
  combinedAvailableKg: string;
  combinedTodayInKg: string;
  combinedTodayOutKg: string;
  coops: LiveStockCoopItem[];
}

export const stockMovementDirections = ["IN", "OUT"] as const;
export type StockMovementDirection = (typeof stockMovementDirections)[number];

export const stockMovementTypes = [
  "PRODUCTION_IN",
  "PRODUCTION_CORRECTION_IN",
  "PRODUCTION_CORRECTION_OUT",
  "ALLOCATION_OUT",
  "ALLOCATION_RELEASE",
  "MANUAL_ADJUST_IN",
  "MANUAL_ADJUST_OUT",
] as const;
export type StockMovementType = (typeof stockMovementTypes)[number];

export interface StockMovementItem {
  id: string;
  coopId: string;
  coopName: string;
  movementDate: string;
  movementType: StockMovementType;
  direction: StockMovementDirection;
  sourceType: "PRODUCTION_RECORD" | "ORDER_ALLOCATION" | "MANUAL_ADJUSTMENT";
  sourceId: string;
  orderId: string | null;
  quantityKg: string;
  notes: string | null;
  createdAt: string;
  createdByName: string | null;
}

export interface NetIncomeItem {
  coopId: string;
  coopName: string;
  grossIncome: string;
  totalExpenses: string;
  depreciation: string;
  netIncome: string;
  month: number;
  year: number;
}

export interface MonthlySummaryItem {
  coopId: string;
  coopName: string;
  ownershipSharePercent: number;
  grossIncome: string;
  totalExpenses: string;
  depreciation: string;
  netIncome: string;
  ownerShare: string;
}

export interface MonthlySummaryResponse {
  ownerId: string;
  ownerName: string;
  month: number;
  year: number;
  coops: MonthlySummaryItem[];
  totalOwnerShare: string;
}

export interface CalendarDay {
  date: string;
  events: {
    orders: Array<{
      orderId: string;
      customerName: string;
      quantityKg: string;
      deliveryStatus: DeliveryStatus;
      paymentStatus: PaymentStatus;
    }>;
    productions: Array<{
      coopId: string;
      coopName: string;
      totalGoodKg: string;
      collectionCount: number;
    }>;
    expenses: Array<{
      coopId: string;
      totalAmount: string;
    }>;
    priceUpdates: Array<{
      pricePerKg: string;
    }>;
  };
}

export interface MenuItem {
  label: string;
  path: string;
  description: string;
  permission: Permission;
  icon: AppIconName;
}

export type Permission =
  | "dashboard.view"
  | "calendar.view"
  | "orders.view"
  | "orders.manage"
  | "orders.deliver"
  | "orders.pay"
  | "orders.cancel"
  | "productions.view"
  | "productions.manage"
  | "expenses.view"
  | "expenses.manage"
  | "expense-categories.view"
  | "expense-categories.manage"
  | "coops.view"
  | "coops.manage"
  | "users.view"
  | "users.manage"
  | "customers.view"
  | "customers.manage"
  | "prices.view"
  | "prices.manage"
  | "stocks.view"
  | "reports.view"
  | "profile.view";
import type { AppIconName } from "../utils/icons";
