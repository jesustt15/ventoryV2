import { LogOutIcon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavUserProps {
  user: {
    username: string;
    role: string;
    avatar: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Error en respuesta de logout:', await response.json());
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 flex-1">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="rounded-lg">
              {user.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.username}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 p-2 rounded hover:bg-accent hover:text-accent-foreground"
          aria-label="Logout"
        >
          <LogOutIcon className="size-4" />
        </button>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
