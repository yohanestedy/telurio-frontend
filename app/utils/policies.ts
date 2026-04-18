import type { MenuItem, Permission, Role } from "../types/domain";

export const permissionMap: Record<Permission, Role[]> = {
  "dashboard.view": ["ADMIN", "OWNER", "OPERATOR"],
  "calendar.view": ["ADMIN", "OWNER", "OPERATOR"],
  "orders.view": ["ADMIN", "OWNER", "OPERATOR"],
  "orders.manage": ["ADMIN"],
  "orders.deliver": ["ADMIN", "OPERATOR"],
  "orders.pay": ["ADMIN", "OWNER", "OPERATOR"],
  "orders.cancel": ["ADMIN"],
  "productions.view": ["ADMIN", "OPERATOR"],
  "productions.manage": ["ADMIN", "OPERATOR"],
  "expenses.view": ["ADMIN", "OWNER"],
  "expenses.manage": ["ADMIN", "OWNER"],
  "expense-categories.view": ["ADMIN", "OWNER"],
  "expense-categories.manage": ["OWNER"],
  "coops.view": ["ADMIN", "OWNER", "OPERATOR"],
  "coops.manage": ["ADMIN"],
  "users.view": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "customers.view": ["ADMIN", "OWNER"],
  "customers.manage": ["ADMIN"],
  "prices.view": ["ADMIN", "OWNER", "OPERATOR"],
  "prices.manage": ["ADMIN"],
  "stocks.view": ["ADMIN", "OWNER", "OPERATOR"],
  "reports.view": ["ADMIN", "OWNER", "OPERATOR"],
  "profile.view": ["ADMIN", "OWNER", "OPERATOR"],
};

export function hasPermission(role: Role | undefined, permission: Permission) {
  if (!role) {
    return false;
  }

  return permissionMap[permission].includes(role);
}

const menuMap: Record<Role, { desktop: MenuItem[]; mobile: MenuItem[] }> = {
  ADMIN: {
    desktop: [
      {
        label: "Dashboard",
        path: "/",
        description: "Ringkasan operasi",
        permission: "dashboard.view",
        icon: "dashboard",
      },
      {
        label: "Calendar",
        path: "/calendar",
        description: "Agenda lintas aktivitas",
        permission: "calendar.view",
        icon: "calendar",
      },
      {
        label: "Orders",
        path: "/orders",
        description: "Pesanan, delivery, pembayaran",
        permission: "orders.view",
        icon: "orders",
      },
      {
        label: "Coops",
        path: "/coops",
        description: "Master kandang",
        permission: "coops.view",
        icon: "coops",
      },
      {
        label: "Users",
        path: "/users",
        description: "Akun owner dan operator",
        permission: "users.view",
        icon: "users",
      },
      {
        label: "Customers",
        path: "/customers",
        description: "Pelanggan",
        permission: "customers.view",
        icon: "customers",
      },
      {
        label: "Daily Prices",
        path: "/prices",
        description: "Harga telur harian",
        permission: "prices.view",
        icon: "prices",
      },
      {
        label: "Stocks",
        path: "/stocks",
        description: "Ledger pergerakan stok",
        permission: "stocks.view",
        icon: "layers",
      },
      {
        label: "Reports",
        path: "/reports",
        description: "Gross, net, summary",
        permission: "reports.view",
        icon: "reports",
      },
      {
        label: "Profile",
        path: "/profile",
        description: "Profil dan keamanan",
        permission: "profile.view",
        icon: "profile",
      },
    ],
    mobile: [
      {
        label: "Dashboard",
        path: "/",
        description: "Ringkasan operasi",
        permission: "dashboard.view",
        icon: "dashboard",
      },
      {
        label: "Calendar",
        path: "/calendar",
        description: "Agenda",
        permission: "calendar.view",
        icon: "calendar",
      },
      {
        label: "Orders",
        path: "/orders",
        description: "Pesanan",
        permission: "orders.view",
        icon: "orders",
      },
      {
        label: "More",
        path: "/profile",
        description: "Menu lainnya",
        permission: "profile.view",
        icon: "more",
      },
    ],
  },
  OWNER: {
    desktop: [
      {
        label: "Dashboard",
        path: "/",
        description: "Ringkasan finansial",
        permission: "dashboard.view",
        icon: "dashboard",
      },
      {
        label: "Calendar",
        path: "/calendar",
        description: "Agenda kandang",
        permission: "calendar.view",
        icon: "calendar",
      },
      {
        label: "Orders",
        path: "/orders",
        description: "Order terkait kandang",
        permission: "orders.view",
        icon: "orders",
      },
      {
        label: "Stocks",
        path: "/stocks",
        description: "Ledger pergerakan stok",
        permission: "stocks.view",
        icon: "layers",
      },
      {
        label: "Expenses",
        path: "/expenses",
        description: "Pengeluaran kandang",
        permission: "expenses.view",
        icon: "expenses",
      },
      {
        label: "Expense Categories",
        path: "/expense-categories",
        description: "Kategori pengeluaran",
        permission: "expense-categories.view",
        icon: "categories",
      },
      {
        label: "Reports",
        path: "/reports",
        description: "Laporan bulanan",
        permission: "reports.view",
        icon: "reports",
      },
      {
        label: "Profile",
        path: "/profile",
        description: "Profil dan keamanan",
        permission: "profile.view",
        icon: "profile",
      },
    ],
    mobile: [
      {
        label: "Dashboard",
        path: "/",
        description: "Ringkasan",
        permission: "dashboard.view",
        icon: "dashboard",
      },
      {
        label: "Calendar",
        path: "/calendar",
        description: "Agenda",
        permission: "calendar.view",
        icon: "calendar",
      },
      {
        label: "Expenses",
        path: "/expenses",
        description: "Pengeluaran",
        permission: "expenses.view",
        icon: "expenses",
      },
      {
        label: "More",
        path: "/profile",
        description: "Menu lainnya",
        permission: "profile.view",
        icon: "more",
      },
    ],
  },
  OPERATOR: {
    desktop: [
      {
        label: "Dashboard",
        path: "/",
        description: "Operasional harian",
        permission: "dashboard.view",
        icon: "dashboard",
      },
      {
        label: "Calendar",
        path: "/calendar",
        description: "Agenda pengantaran",
        permission: "calendar.view",
        icon: "calendar",
      },
      {
        label: "Orders",
        path: "/orders",
        description: "Delivery dan pembayaran",
        permission: "orders.view",
        icon: "orders",
      },
      {
        label: "Stocks",
        path: "/stocks",
        description: "Ledger pergerakan stok",
        permission: "stocks.view",
        icon: "layers",
      },
      {
        label: "Productions",
        path: "/productions",
        description: "Produksi telur harian",
        permission: "productions.view",
        icon: "productions",
      },
      {
        label: "Profile",
        path: "/profile",
        description: "Profil dan keamanan",
        permission: "profile.view",
        icon: "profile",
      },
    ],
    mobile: [
      {
        label: "Dashboard",
        path: "/",
        description: "Ringkasan",
        permission: "dashboard.view",
        icon: "dashboard",
      },
      {
        label: "Orders",
        path: "/orders",
        description: "Order",
        permission: "orders.view",
        icon: "orders",
      },
      {
        label: "Productions",
        path: "/productions",
        description: "Produksi",
        permission: "productions.view",
        icon: "productions",
      },
      {
        label: "More",
        path: "/profile",
        description: "Menu lainnya",
        permission: "profile.view",
        icon: "more",
      },
    ],
  },
};

export function getMenuByRole(role: Role | undefined) {
  if (!role) {
    return { desktop: [], mobile: [] };
  }

  return menuMap[role];
}
