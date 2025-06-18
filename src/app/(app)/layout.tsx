import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="w-full flex h-screen antialiased text-foreground">
        <AppSidebar className="flex-shrink-0 hidden md:block" />
        <div className="flex-1 flex flex-col">
          <SiteHeader />
          <main className="flex-1 p-4 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}