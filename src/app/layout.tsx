import { ThemeProvider } from "../components/theme-provider"
import { ReactNode } from "react";
import './globals.css'
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider } from "@/components/ui/sidebar";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <div className="flex h-screen antialiased text-foreground">
                <AppSidebar className="flex-shrink-0 hidden md:block" />
                <div className="flex-1 flex flex-col">
                  <SiteHeader />
                  <main className="flex-1 p-4">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
