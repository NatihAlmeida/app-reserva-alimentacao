import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaUtensils, FaBox, FaPlus, FaChartBar, FaSignOutAlt, FaCog } from 'react-icons/fa';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'products', label: 'Produtos', icon: <FaUtensils /> },
    { id: 'newProduct', label: 'Novo Produto', icon: <FaPlus /> },
    { id: 'reservations', label: 'Reservas', icon: <FaBox /> },
    { id: 'stats', label: 'Estatísticas', icon: <FaChartBar /> },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary-600">Cantina</h1>
        <p className="text-sm text-gray-500">Admin Panel</p>
      </div>
      
      <nav className="flex-1 p-4">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all ${
              activeTab === item.id
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <button
          onClick={() => navigate('/configuracoes')}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 mb-2 transition-all"
        >
          <FaCog />
          <span>Configurações</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
        >
          <FaSignOutAlt />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}