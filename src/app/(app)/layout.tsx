
import { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth-server";
import AppLayoutClient from "./AppLayoutClient";


type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getSessionUser();
  
  return <AppLayoutClient user={user}>{children}</AppLayoutClient>;
}