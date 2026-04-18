import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  Clock3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  Coins,
  Egg,
  Filter,
  Home,
  KeyRound,
  LayoutDashboard,
  Layers3,
  LogOut,
  MoreHorizontal,
  Minus,
  Package,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-vue-next";

export const appIcons = {
  home: Home,
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  clock: Clock3,
  orders: ShoppingCart,
  coops: Warehouse,
  users: Users,
  user: CircleUserRound,
  addUser: UserPlus,
  customers: CircleUserRound,
  prices: Coins,
  money: CircleDollarSign,
  reports: BarChart3,
  profile: ShieldCheck,
  more: MoreHorizontal,
  productions: Egg,
  expenses: Receipt,
  categories: Wallet,
  refresh: RefreshCw,
  plus: Plus,
  edit: Pencil,
  delete: Trash2,
  alert: TriangleAlert,
  search: Search,
  share: Share2,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  minus: Minus,
  filter: Filter,
  sort: ArrowUpDown,
  delivery: Truck,
  layers: Layers3,
  logout: LogOut,
  close: X,
  key: KeyRound,
  package: Package,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof appIcons;

export function resolveAppIcon(name?: AppIconName) {
  if (!name) {
    return null;
  }

  return appIcons[name];
}

export function getPageIcon(path: string): AppIconName {
  if (path === "/") {
    return "dashboard";
  }

  if (path.startsWith("/calendar")) {
    return "calendar";
  }

  if (path.startsWith("/orders")) {
    return "orders";
  }

  if (path.startsWith("/coops")) {
    return "coops";
  }

  if (path.startsWith("/users")) {
    return "users";
  }

  if (path.startsWith("/customers")) {
    return "customers";
  }

  if (path.startsWith("/prices")) {
    return "prices";
  }

  if (path.startsWith("/reports")) {
    return "reports";
  }

  if (path.startsWith("/stocks")) {
    return "layers";
  }

  if (path.startsWith("/expenses")) {
    return "expenses";
  }

  if (path.startsWith("/expense-categories")) {
    return "categories";
  }

  if (path.startsWith("/productions")) {
    return "productions";
  }

  if (path.startsWith("/profile")) {
    return "profile";
  }

  return "home";
}
