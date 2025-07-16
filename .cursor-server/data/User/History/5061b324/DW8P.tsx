import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { AlertTriangle, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: 'superadmin' | 'admin' | 'agent';
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/dashboard',
  showAccessDenied = true
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar role se especificado
  if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
    if (showAccessDenied) {
      return (
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
              <p className="text-gray-600 mb-4">
                Esta funcionalidade requer nível de acesso: <strong>{requiredRole}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Seu nível atual: <strong>{user.role}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar permissão se especificada
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (showAccessDenied) {
      return (
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
              <p className="text-gray-600 mb-4">
                Você não tem permissão para acessar esta funcionalidade.
              </p>
              <p className="text-sm text-gray-500">
                Permissão necessária: <strong>{requiredPermission}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 