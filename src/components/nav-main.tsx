"use client";

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    router.push(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  className={cn(
                    // Clases base para todos los botones
                    "transition-colors duration-150",
                    // Clases para el estado ACTIVO
                    isActive && "bg-primary text-primary-foreground",
                    // Clases para el estado HOVER (cuando NO está activo)
                    !isActive && "hover:bg-accent hover:text-accent-foreground"
                  )}
                  tooltip={item.title}
                  onClick={(e) => {
                    handleClick(e, item.url);
                  }}
                  asChild
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}