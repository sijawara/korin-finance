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
      url: "/dashboard/reports",
      iconName: "BarChart3",
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      iconName: "Wallet",
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      iconName: "Tag",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
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
