"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ArrowUpCircle,
  LayoutDashboard,
  Wallet,
  BarChart3,
  Settings,
  Tag,
  LucideIcon,
  LogOut,
} from "lucide-react";
import { NavItemProps } from "./app-sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { KorinAILogo } from "./sidebar-provider-client";

interface AppSidebarClientProps extends React.ComponentProps<typeof Sidebar> {
  navItems: {
    navMain: NavItemProps[];
    navSecondary: NavItemProps[];
  };
}

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Settings,
  Tag,
  ArrowUpCircle,
};

export function AppSidebarClient({
  navItems,
  ...props
}: AppSidebarClientProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  // Check if current path matches the item URL
  const isActive = (url: string) => {
    return pathname.startsWith(url);
  };

  // Dynamic icon component renderer
  const IconComponent = ({
    iconName,
    className,
  }: {
    iconName: string;
    className?: string;
  }) => {
    const Icon = iconMap[iconName];

    if (!Icon) {
      console.warn(`Icon '${iconName}' not found`);
      return null;
    }

    return <Icon className={className} />;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/finance/reports" className="flex items-center">
                <KorinAILogo
                  size={28}
                  className="min-w-7 min-h-7"
                  withText={isExpanded}
                  textClassName="text-base"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <IconComponent
                        iconName={item.iconName}
                        className="h-4 w-4"
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <IconComponent
                        iconName={item.iconName}
                        className="h-4 w-4"
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
        <p className="text-xs text-muted-foreground">
          © 2024 KorinAI Desk. All rights reserved.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
