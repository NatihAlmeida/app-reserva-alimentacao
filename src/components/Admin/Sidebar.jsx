import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaBox,
  FaChartBar,
  FaCog,
  FaHome,
  FaPlus,
  FaSignOutAlt,
  FaStore,
  FaUserGraduate,
  FaUtensils,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <FaHome /> },
  { id: 'products', label: 'Produtos', icon: <FaUtensils /> },
  { id: 'newProduct', label: 'Novo Produto', icon: <FaPlus /> },
  { id: 'reservations', label: 'Reservas', icon: <FaBox /> },
  { id: 'students', label: 'Alunos', icon: <FaUserGraduate /> },
  { id: 'notifications', label: 'Notificações', icon: <FaBell /> },
  { id: 'reports', label: 'Relatórios', icon: <FaChartBar /> },
  { id: 'settings', label: 'Configurações', icon: <FaCog /> },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm lg:flex">
      <div className="border-b p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-700 text-white">
            <FaStore />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-primary-700">Cantina</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {adminMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold transition ${
              activeTab === item.id
                ? 'bg-primary-700 text-white shadow-md shadow-primary-900/10'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-800'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <FaSignOutAlt />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ activeTab, setActiveTab }) {
  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:hidden">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="text-xs font-bold uppercase text-primary-600">Admin Panel</p>
          <h1 className="text-lg font-extrabold text-gray-900">Cantina</h1>
        </div>
        <FaStore className="text-2xl text-primary-700" />
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {adminMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
              activeTab === item.id
                ? 'bg-primary-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
