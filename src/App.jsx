import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProductProvider } from './context/ProductContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import MinhasReservas from './pages/MinhasReservas';
import StudentDashboard from './components/Student/StudentDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProtectedRoute from './components/UI/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <ProductProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/minhas-reservas"
                element={
                  <ProtectedRoute>
                    <MinhasReservas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
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
            </Routes>
          </ProductProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
