import type { MenuItem, Permission, Role } from '../types/domain'

export const permissionMap: Record<Permission, Role[]> = {
  'dashboard.view': ['ADMIN', 'OWNER', 'OPERATOR'],
  'calendar.view': ['ADMIN', 'OWNER', 'OPERATOR'],
  'orders.view': ['ADMIN', 'OWNER', 'OPERATOR'],
  'orders.manage': ['ADMIN'],
  'orders.deliver': ['ADMIN', 'OPERATOR'],
  'orders.pay': ['ADMIN', 'OWNER', 'OPERATOR'],
  'orders.cancel': ['ADMIN'],
  'productions.view': ['ADMIN', 'OPERATOR'],
  'productions.manage': ['ADMIN', 'OPERATOR'],
  'expenses.view': ['ADMIN', 'OWNER'],
  'expenses.manage': ['ADMIN', 'OWNER'],
  'expense-categories.view': ['ADMIN', 'OWNER'],
  'expense-categories.manage': ['OWNER'],
  'coops.view': ['ADMIN', 'OWNER', 'OPERATOR'],
  'coops.manage': ['ADMIN'],
  'users.view': ['ADMIN'],
  'users.manage': ['ADMIN'],
  'customers.view': ['ADMIN', 'OWNER'],
  'customers.manage': ['ADMIN'],
  'prices.view': ['ADMIN', 'OWNER', 'OPERATOR'],
  'prices.manage': ['ADMIN'],
  'reports.view': ['ADMIN', 'OWNER', 'OPERATOR'],
  'profile.view': ['ADMIN', 'OWNER', 'OPERATOR'],
}

export function hasPermission(role: Role | undefined, permission: Permission) {
  if (!role) {
    return false
  }

  return permissionMap[permission].includes(role)
}

const menuMap: Record<Role, { desktop: MenuItem[]; mobile: MenuItem[] }> = {
  ADMIN: {
    desktop: [
      { label: 'Dashboard', path: '/', description: 'Ringkasan operasi', permission: 'dashboard.view' },
      { label: 'Calendar', path: '/calendar', description: 'Agenda lintas aktivitas', permission: 'calendar.view' },
      { label: 'Orders', path: '/orders', description: 'Pesanan, delivery, pembayaran', permission: 'orders.view' },
      { label: 'Coops', path: '/coops', description: 'Master kandang', permission: 'coops.view' },
      { label: 'Users', path: '/users', description: 'Akun owner dan operator', permission: 'users.view' },
      { label: 'Customers', path: '/customers', description: 'Pelanggan', permission: 'customers.view' },
      { label: 'Daily Prices', path: '/prices', description: 'Harga telur harian', permission: 'prices.view' },
      { label: 'Reports', path: '/reports', description: 'Gross, net, summary', permission: 'reports.view' },
      { label: 'Profile', path: '/profile', description: 'Profil dan keamanan', permission: 'profile.view' },
    ],
    mobile: [
      { label: 'Dashboard', path: '/', description: 'Ringkasan operasi', permission: 'dashboard.view' },
      { label: 'Calendar', path: '/calendar', description: 'Agenda', permission: 'calendar.view' },
      { label: 'Orders', path: '/orders', description: 'Pesanan', permission: 'orders.view' },
      { label: 'More', path: '/profile', description: 'Menu lainnya', permission: 'profile.view' },
    ],
  },
  OWNER: {
    desktop: [
      { label: 'Dashboard', path: '/', description: 'Ringkasan finansial', permission: 'dashboard.view' },
      { label: 'Calendar', path: '/calendar', description: 'Agenda kandang', permission: 'calendar.view' },
      { label: 'Orders', path: '/orders', description: 'Order terkait kandang', permission: 'orders.view' },
      { label: 'Expenses', path: '/expenses', description: 'Pengeluaran kandang', permission: 'expenses.view' },
      { label: 'Expense Categories', path: '/expense-categories', description: 'Kategori pengeluaran', permission: 'expense-categories.view' },
      { label: 'Reports', path: '/reports', description: 'Laporan bulanan', permission: 'reports.view' },
      { label: 'Profile', path: '/profile', description: 'Profil dan keamanan', permission: 'profile.view' },
    ],
    mobile: [
      { label: 'Dashboard', path: '/', description: 'Ringkasan', permission: 'dashboard.view' },
      { label: 'Calendar', path: '/calendar', description: 'Agenda', permission: 'calendar.view' },
      { label: 'Expenses', path: '/expenses', description: 'Pengeluaran', permission: 'expenses.view' },
      { label: 'More', path: '/profile', description: 'Menu lainnya', permission: 'profile.view' },
    ],
  },
  OPERATOR: {
    desktop: [
      { label: 'Dashboard', path: '/', description: 'Operasional harian', permission: 'dashboard.view' },
      { label: 'Calendar', path: '/calendar', description: 'Agenda pengantaran', permission: 'calendar.view' },
      { label: 'Orders', path: '/orders', description: 'Delivery dan pembayaran', permission: 'orders.view' },
      { label: 'Productions', path: '/productions', description: 'Produksi telur harian', permission: 'productions.view' },
      { label: 'Profile', path: '/profile', description: 'Profil dan keamanan', permission: 'profile.view' },
    ],
    mobile: [
      { label: 'Dashboard', path: '/', description: 'Ringkasan', permission: 'dashboard.view' },
      { label: 'Orders', path: '/orders', description: 'Order', permission: 'orders.view' },
      { label: 'Productions', path: '/productions', description: 'Produksi', permission: 'productions.view' },
      { label: 'More', path: '/profile', description: 'Menu lainnya', permission: 'profile.view' },
    ],
  },
}

export function getMenuByRole(role: Role | undefined) {
  if (!role) {
    return { desktop: [], mobile: [] }
  }

  return menuMap[role]
}
