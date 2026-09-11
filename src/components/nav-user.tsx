"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconDotsVertical,
  IconLogout,
  IconShieldCheck,
  IconUserCircle,
} from "@tabler/icons-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavUserProps {
  user?: {
    name: string;
    role?: string;
    avatar?: string;
  };
}

export function NavUser({ user: initialUser }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState({
    name: "Dr. Priya Sharma",
    role: "DGMS Regulator",
    avatar: "",
  });

  const syncUser = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser({
            name: parsed.name || "Officer",
            role:
              parsed.role === "regulator"
                ? "DGMS Regulator"
                : parsed.role === "mine_officer"
                ? "Mine Officer"
                : parsed.role === "frontline"
                ? "Frontline Sirdar"
                : "Administrator",
            avatar: "",
          });
          return;
        }
      } catch {
        // use fallback
      }
    }
  };

  useEffect(() => {
    syncUser();
    const handler = () => syncUser();
    window.addEventListener("aegis-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aegis-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const user = initialUser || currentUser;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("dcrm.accessToken");
      localStorage.removeItem("dcrm.user");
    }
    router.push("/sign-in");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleStyle = (roleStr: string) => {
    if (roleStr.includes("Mine")) {
      return {
        bg: "bg-sky-500/20 text-sky-400 border-sky-500/30",
        text: "text-sky-300",
        icon: "text-sky-400",
      };
    }
    if (roleStr.includes("Frontline") || roleStr.includes("Sirdar")) {
      return {
        bg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        text: "text-amber-300",
        icon: "text-amber-400",
      };
    }
    if (roleStr.includes("Admin")) {
      return {
        bg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        text: "text-purple-300",
        icon: "text-purple-400",
      };
    }
    return {
      bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      text: "text-emerald-300",
      icon: "text-emerald-400",
    };
  };

  const roleStyle = getRoleStyle(user.role || "");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <Avatar className={`h-8 w-8 rounded-lg ${roleStyle.bg} border`}>
                <AvatarFallback className={`rounded-lg ${roleStyle.bg} font-semibold text-xs`}>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs flex items-center gap-1">
                  <IconShieldCheck className={`h-3 w-3 ${roleStyle.icon} shrink-0`} />
                  {user.role || "Auditor"}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-[#0e141d] border-white/10 text-foreground shadow-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className={`h-8 w-8 rounded-lg ${roleStyle.bg} border`}>
                  <AvatarFallback className={`rounded-lg ${roleStyle.bg} font-semibold text-xs`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.role || "Auditor"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5">
                <IconUserCircle className="mr-2 h-4 w-4" />
                Officer Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400">
              <IconLogout className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
