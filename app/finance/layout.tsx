import { AppSidebar } from "./components/app-sidebar";
import { SiteHeader } from "./components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarProviderClient } from "./components/sidebar-provider-client";
import { WithAuth } from "./components/with-auth";
import { LogoProvider } from "./components/logo-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WithAuth>
      <LogoProvider>
        <SidebarProviderClient defaultOpen={true}>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            {children}
          </SidebarInset>
        </SidebarProviderClient>
      </LogoProvider>
    </WithAuth>
  );
}
