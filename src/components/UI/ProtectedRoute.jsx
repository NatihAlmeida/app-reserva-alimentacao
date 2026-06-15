import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * Rota protegida por autenticação Firebase.
 * - adminOnly: requer perfil === "admin"
 * - allowedRoles: array de perfis permitidos (ex: ["aluno"])
 */
export default function ProtectedRoute({ children, adminOnly = false, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.perfil !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.perfil)) {
    const destino = user.perfil === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={destino} replace />;
  }

  return children;
}