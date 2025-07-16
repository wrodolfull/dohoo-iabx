import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Phone,
  Users,
  Bot,
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Settings,
  CreditCard,
  UserCog,
  Building,
  PhoneCall,
  Clock,
  FileText,
  Cpu,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Activity,
  Monitor,
  PhoneForwarded,
  PieChart
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { canAccess } = useAuth();
  const [ringGroupsExpanded, setRingGroupsExpanded] = useState(false);

  const menuItems = [
    {
      title: 'Principal',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          description: 'Visão geral do sistema',
          resource: 'dashboard'
        },
        {
          name: 'Ramais',
          href: '/extensions',
          icon: Phone,
          description: 'Gerenciar ramais SIP',
          resource: 'extensions'
        },
        {
          name: 'Grupos de Toque',
          href: '/ring-groups',
          icon: Users,
          description: 'Grupos de atendimento',
          resource: 'ringgroups'
        },
        {
          name: 'URA Builder',
          href: '/ura-builder',
          icon: Bot,
          description: 'Construtor de URA com IA',
          resource: 'ura'
        }
      ]
    },
    {
      title: 'Conectividade',
      items: [
        {
          name: 'Troncos SIP',
          href: '/trunks',
          icon: Server,
          description: 'Provedores de telefonia',
          resource: 'trunks'
        },
        {
          name: 'Rotas de Entrada',
          href: '/inbound-routes',
          icon: ArrowDownToLine,
          description: 'Roteamento de chamadas',
          resource: 'routes'
        },
        {
          name: 'Rotas de Saída',
          href: '/outbound-routes',
          icon: ArrowUpFromLine,
          description: 'Regras de discagem',
          resource: 'routes'
        }
      ]
    },
    {
      title: 'Monitoramento',
      items: [
        {
          name: 'Dashboard Ring Groups',
          href: '/ring-groups-dashboard',
          icon: PieChart,
          description: 'Análise e métricas dos grupos',
          resource: 'ringgroups'
        },
        {
          name: 'Relatórios',
          href: '/reports',
          icon: BarChart3,
          description: 'CDR e estatísticas',
          resource: 'reports'
        },
        {
          name: 'Relatórios Avançados',
          href: '/advanced-reports',
          icon: FileText,
          description: 'Análise completa e gravações',
          resource: 'advanced-reports'
        },
        {
          name: 'Chamadas Ativas',
          href: '/active-calls',
          icon: PhoneCall,
          description: 'Monitor em tempo real',
          resource: 'calls'
        }
      ]
    },
    {
      title: 'Administração',
      items: [
        {
          name: 'Usuários',
          href: '/users',
          icon: UserCog,
          description: 'Gerenciar usuários',
          resource: 'users'
        },
        {
          name: 'Empresas',
          href: '/tenants',
          icon: Building,
          description: 'Multi-tenant',
          resource: 'tenants'
        },
        {
          name: 'Planos',
          href: '/plans',
          icon: CreditCard,
          description: 'Assinaturas e cobrança',
          resource: 'plans'
        },
        {
          name: 'Logs de Auditoria',
          href: '/audit-logs',
          icon: FileText,
          description: 'Visualizar logs de atividades',
          resource: 'audit-logs'
        },
        {
          name: 'Horários',
          href: '/schedules',
          icon: Clock,
          description: 'Configurar horários de atendimento',
          resource: 'schedules'
        },
        {
          name: 'Configurações',
          href: '/settings',
          icon: Settings,
          description: 'Configurações do sistema',
          resource: 'settings'
        },
        {
          name: 'FreeSWITCH Avançado',
          href: '/freeswitch-admin',
          icon: Cpu,
          description: 'Configurações avançadas do FreeSWITCH',
          resource: 'freeswitch-admin'
        }
      ]
    }
  ];

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#7C45D0] rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dohoo</h1>
            <p className="text-xs text-gray-500">Voice Platform</p>
          </div>
        </div>

        <nav className="space-y-6">
          {menuItems.map((section) => {
            // Filtrar itens baseado nas permissões
            const filteredItems = section.items.filter(item => canAccess(item.resource));
            
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors group",
                          isActive
                            ? "bg-[#7C45D0] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5",
                          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                        )} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Ring Groups Expandido */}
          {canAccess('ringgroups') && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Ring Groups
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setRingGroupsExpanded(!ringGroupsExpanded)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                    <span className="font-medium">Análise Avançada</span>
                  </div>
                  {ringGroupsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {ringGroupsExpanded && (
                  <div className="ml-8 space-y-1">
                    <Link
                      to="/ring-groups-dashboard"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                        location.pathname === '/ring-groups-dashboard'
                          ? "bg-[#7C45D0] text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <PieChart className="w-4 h-4" />
                      Dashboard Detalhado
                    </Link>
                    <Link
                      to="/ring-groups-analytics"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                        location.pathname === '/ring-groups-analytics'
                          ? "bg-[#7C45D0] text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Activity className="w-4 h-4" />
                      Analytics
                    </Link>
                    <Link
                      to="/ring-groups-performance"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                        location.pathname === '/ring-groups-performance'
                          ? "bg-[#7C45D0] text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Performance
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 