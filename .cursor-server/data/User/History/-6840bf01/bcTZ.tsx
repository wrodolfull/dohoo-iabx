import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import TenantSelector from "@/components/TenantSelector";
import { useTenant } from "@/hooks/useTenant";

export function Header() {
  const { user, logout } = useAuth();
  const { isSuperAdmin, selectedTenantId, handleTenantChange } = useTenant();

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
        <h2 className="text-lg font-semibold text-gray-900">
          Painel Administrativo
        </h2>
        {isSuperAdmin && (
          <div className="flex items-center gap-2 ml-4">
            <TenantSelector
              selectedTenantId={selectedTenantId}
              onTenantChange={handleTenantChange}
              title=""
              description=""
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start p-4">
              <div className="font-medium">Consumo de IA elevado</div>
              <div className="text-sm text-gray-500">
                Você já utilizou 85% dos seus minutos de IA este mês
              </div>
              <div className="text-xs text-gray-400">há 2 horas</div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start p-4">
              <div className="font-medium">Novo ramal cadastrado</div>
              <div className="text-sm text-gray-500">
                Ramal 1004 foi criado com sucesso
              </div>
              <div className="text-xs text-gray-400">há 1 dia</div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start p-4">
              <div className="font-medium">Pagamento aprovado</div>
              <div className="text-sm text-gray-500">
                Cobrança mensal processada com sucesso
              </div>
              <div className="text-xs text-gray-400">há 3 dias</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Menu do usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-3">
              <div className="w-8 h-8 bg-gradient-to-br from-dohoo-primary to-dohoo-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => logout()}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
