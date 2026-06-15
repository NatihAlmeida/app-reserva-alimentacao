import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProductProvider } from './context/ProductContext';
import Login from './pages/Login';
import Register from './pages/Cadastro';
import AdminSetup from './pages/AdminSetup';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import MinhasReservas from './pages/MinhasReservas';
import StudentDashboard from './components/Student/StudentDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProtectedRoute from './components/UI/ProtectedRoute';

function App() {
  return (
    // 🚀 CORREÇÃO 1: O AuthProvider agora é o topo absoluto, envolvendo o Router e os outros Contextos!
    <AuthProvider>
      <NotificationProvider>
        <ProductProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              
              {/* CORREÇÃO 2: Alterado de 'student' para 'aluno' para bater com seu perfil Firestore */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['aluno']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* CORREÇÃO 3: Alterado de 'student' para 'aluno' */}
              <Route
                path="/minhas-reservas"
                element={
                  <ProtectedRoute allowedRoles={['aluno']}>
                    <MinhasReservas />
                  </ProtectedRoute>
                }
              />
              
              {/* CORREÇÃO 4: Garantido allowedRoles={['admin']} para alinhar com o ProtectedRoute atualizado */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </ProductProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;