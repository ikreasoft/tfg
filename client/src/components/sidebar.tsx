import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Camera,
  Radio,
  History,
  Settings,
  LogOut,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
    },
    {
      title: "Cámaras",
      icon: Camera,
      href: "/cameras",
    },
    {
      title: "Sensores",
      icon: Radio,
      href: "/sensors",
    },
    {
      title: "Grabaciones",
      icon: History,
      href: "/sessions",
    },
    {
      title: "Configuración",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <div className="h-screen w-[250px] border-r bg-sidebar p-4 flex flex-col">
      <div className="flex-1 space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 text-lg font-semibold">Video Lab Monitor</h2>
          <p className="text-xs text-sidebar-foreground/60">
            Sistema de monitorización
          </p>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  );
}