import * as React from "react";
import { AppSidebarClient } from "./app-sidebar-client";

export interface NavItemProps {
  title: string;
  url: string;
  iconName: string;
}

const defaultNavItems = {
  navMain: [
    {
      title: "Reports",
      url: "/finance/reports",
      iconName: "BarChart3",
    },
    {
      title: "Transactions",
      url: "/finance/transactions",
      iconName: "Wallet",
    },
    {
      title: "Categories",
      url: "/finance/categories",
      iconName: "Tag",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/finance/settings",
      iconName: "Settings",
    },
  ],
};

interface AppSidebarProps
  extends Omit<React.ComponentProps<typeof AppSidebarClient>, "navItems"> {
  navItems?: {
    navMain: NavItemProps[];
    navSecondary: NavItemProps[];
  };
}

export function AppSidebar({
  navItems = defaultNavItems,
  ...props
}: AppSidebarProps) {
  return <AppSidebarClient navItems={navItems} {...props} />;
}
