import React from 'react';
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
  FileText
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { canAccess } = useAuth();

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
          name: 'Relatórios', 
          href: '/reports', 
          icon: BarChart3,
          description: 'CDR e estatísticas',
          resource: 'reports'
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
            const visibleItems = section.items.filter(item => canAccess(item.resource));
            
            // Só mostrar a seção se houver itens visíveis
            if (visibleItems.length === 0) return null;
            
            return (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                          isActive
                            ? "bg-[#7C45D0] text-white"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5",
                          isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                        )} />
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className={cn(
                            "text-xs opacity-75",
                            isActive ? "text-white" : "text-gray-500"
                          )}>
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 