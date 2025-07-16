import {
  LayoutDashboard,
  Phone,
  Users,
  PhoneIncoming,
  PhoneOutgoing,
  Wifi,
  Bot,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: "dashboard.view"
  },
  {
    title: "Ramais",
    url: "/extensions",
    icon: Phone,
    permission: "extensions.view"
  },
  {
    title: "Grupos de Atendimento",
    url: "/ring-groups",
    icon: Users,
    permission: "ringgroups.view"
  },
  {
    title: "Rotas de Entrada",
    url: "/inbound",
    icon: PhoneIncoming,
    permission: "inbound.view"
  },
  {
    title: "Rotas de Saída",
    url: "/outbound",
    icon: PhoneOutgoing,
    permission: "outbound.view"
  },
  {
    title: "Troncos",
    url: "/trunks",
    icon: Wifi,
    permission: "trunks.view"
  },
  {
    title: "URA Builder",
    url: "/ura-builder",
    icon: Bot,
    permission: "ura.view"
  },
  {
    title: "Planos & Minutos",
    url: "/plans",
    icon: CreditCard,
    permission: "plans.view"
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    permission: "reports.view"
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    permission: "settings.view"
  }
];

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const currentPath = location.pathname;
  const collapsed = !open;

  // Fechar sidebar ao navegar em mobile
  useEffect(() => {
    if (window.innerWidth < 768 && open) setOpen(false);
    // eslint-disable-next-line
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";
  };

  const filteredItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <Sidebar className="border-r border-sidebar-border fixed md:static top-0 left-0 z-50 h-full bg-white shadow-lg md:shadow-none">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-white to-sidebar-accent-foreground rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-sidebar-primary" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Dohoo IABX</h1>
                <p className="text-xs text-sidebar-foreground/70">Telefonia Inteligente</p>
              </div>
            )}
          </div>
          {/* Botão de Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="h-8 w-8 hover:bg-sidebar-accent/50 md:hidden"
            aria-label="Fechar sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="h-8 w-8 hover:bg-sidebar-accent/50 hidden md:block"
            aria-label="Colapsar sidebar"
          >
            {collapsed ? 
              <PanelLeftOpen className="h-4 w-4" /> : 
              <PanelLeftClose className="h-4 w-4" />
            }
          </Button>
        </div>
        
        {!collapsed && user && (
          <div className="mt-4 p-3 bg-sidebar-accent/20 rounded-lg">
            <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/70">{user.company}</p>
            <p className="text-xs text-sidebar-foreground/50 uppercase">{user.role}</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/70">
              Menu Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className={getNavClassName(item.url)}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          onClick={logout}
          className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 ${
            collapsed ? 'px-2' : 'px-4'
          }`}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'}`} />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
