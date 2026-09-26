import {
  LayoutDashboard,
  Package,
  FolderKanban,
  Warehouse,
  Boxes,
  ShoppingBag,
  Truck,
  ClipboardList,
  PackageCheck,
  Receipt,
  Building2,
  Wallet,
  Mail,
  Settings,
  Menu,
  Store,
  ShoppingCart,
  UserRound,
  KeyRound,
  Ticket,
  Users,
  ShieldCheck,
  LayoutGrid,
  ClipboardCheck,
  Star,
  Circle
} from 'lucide-react';

/**
 * Peta nama ikon (string dari DB `menus.icon`) ke komponen Lucide (T37.7).
 * Menu yang dibuat admin lewat UI cukup mengisi nama ikon Lucide; nama tak dikenal
 * jatuh ke ikon `Circle` sebagai fallback aman.
 */
export const MENU_ICONS = {
  LayoutDashboard,
  Package,
  FolderKanban,
  Warehouse,
  Boxes,
  ShoppingBag,
  Truck,
  ClipboardList,
  PackageCheck,
  Receipt,
  Building2,
  Wallet,
  Mail,
  Settings,
  Menu,
  Store,
  ShoppingCart,
  UserRound,
  KeyRound,
  Ticket,
  Users,
  ShieldCheck,
  LayoutGrid,
  ClipboardCheck,
  Star
};

export function resolveMenuIcon(name) {
  if (!name) return Circle;
  return MENU_ICONS[name] || Circle;
}
