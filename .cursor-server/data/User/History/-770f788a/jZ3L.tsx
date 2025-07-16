import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Settings,
  ChevronDown
} from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role: string) => {
    const variants: { [key: string]: any } = {
      'superadmin': 'destructive',
      'admin': 'default',
      'agent': 'secondary'
    };
    const labels: { [key: string]: string } = {
      'superadmin': 'Super Admin',
      'admin': 'Administrador',
      'agent': 'Agente'
    };
    return <Badge variant={variants[role]}>{labels[role] || role}</Badge>;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Sistema de Telefonia
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#7C45D0] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <div className="mt-1">
                  {user?.role && getRoleBadge(user.role)}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header; 