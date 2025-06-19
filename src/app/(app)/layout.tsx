import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSessionUser } from "@/lib/auth-server";

import { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};


export default async function AppLayout({ children }: AppLayoutProps) {
const user = await getSessionUser();

  return (
    <SidebarProvider>
      <div className="w-full flex h-screen antialiased text-foreground">
        <AppSidebar className="flex-shrink-0 hidden md:block" user={user} />
        <div className="flex-1 flex flex-col">
          <SiteHeader />
          <main className="flex-1 p-4 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}