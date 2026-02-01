import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Wallet,
  Upload,
  LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  icon: LucideIcon
  href: string
}

export const mainNavItems: NavItem[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Import",
    icon: Upload,
    href: "/import",
  },
  {
    label: "Transactions",
    icon: CreditCard,
    href: "/transactions",
  },
  {
    label: "Accounts",
    icon: Wallet,
    href: "/accounts",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]
