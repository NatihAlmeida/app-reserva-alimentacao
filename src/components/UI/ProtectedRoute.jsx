import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho se necessário

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Correção: Agora verifica se o perfil condiz com 'aluno' ou 'admin' mapeado do banco
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
}