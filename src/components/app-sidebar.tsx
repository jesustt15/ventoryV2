"use client";

import React, { useEffect } from 'react';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, 
         SidebarMenuButton, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboardIcon, Printer, Tag, Laptop, Factory, 
         UsersIcon, ClipboardListIcon, SettingsIcon, HelpCircleIcon, 
         SearchIcon, ArrowUpCircleIcon, LogOutIcon } from 'lucide-react';
import Link from 'next/link';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';
import type { UserJwtPayload } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Spinner } from './ui/spinner';

// Define una estructura de datos para la navegación
const navData = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Modelos", url: "/modelos", icon: Tag },
    { title: "Dispositivos", url: "/dispositivos", icon: Printer },
    { title: "Computadores", url: "/computadores", icon: Laptop },
    { title: "Departamentos", url: "/departamentos", icon: Factory },
    { title: "Usuarios", url: "/usuarios", icon: UsersIcon },
    { title: "Asignaciones", url: "/asignaciones", icon: ClipboardListIcon },
  ],
};

// Define las props que el componente aceptará
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: UserJwtPayload | null;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const router = useRouter();
  
useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="fixed left-0 top-0 h-screen w-64 bg-gray-100 border-r">
        <Spinner />
      </div>
    );
  }

  const userData = {
    username: user.username || "Invitado",
    role: user.role || "user",
    avatar: user.avatar || "",
  };
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Ventory</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
