import { useContext, useState } from 'react';
import { FaBox, FaChartLine, FaStore, FaUsers } from 'react-icons/fa';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';
import Sidebar from './Sidebar';
import ProductList from './ProductList';
import ProductForm from './ProductForm';

const formatDate = (value) => {
  if (!value) return 'Data não informada';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const getStatusLabel = (status) => {
  const labels = {
    confirmed: 'Confirmada',
    ready: 'Pronto',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    pending: 'Pendente',
  };

  return labels[status] || 'Confirmada';
};

const getStatusClass = (status) => {
  if (status === 'confirmed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'ready') return 'bg-green-100 text-green-800';
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-800';
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const { products, reservations } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);

  const stats = {
    totalProducts: products.filter((product) => product.status === 'active').length,
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter(
      (reservation) => reservation.status === 'confirmed'
    ).length,
    revenue: reservations.reduce((sum, reservation) => sum + (reservation.price || 0), 0),
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              Painel Administrativo
            </h1>
            <button
              type="button"
              onClick={() => addNotification('Bem-vindo ao painel admin!', 'info', 'admin')}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Enviar notificação de teste"
            >
              🔔
            </button>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Produtos Ativos" value={stats.totalProducts} icon={<FaStore />} />
            <StatCard label="Total Reservas" value={stats.totalReservations} icon={<FaBox />} />
            <StatCard
              label="Confirmadas"
              value={stats.confirmedReservations}
              icon={<FaUsers />}
              valueClassName="text-emerald-600"
            />
            <StatCard
              label="Receita Total"
              value={`R$ ${stats.revenue.toFixed(2).replace('.', ',')}`}
              icon={<FaChartLine />}
              valueClassName="text-green-600"
            />
          </div>

          {activeTab === 'products' && <ProductList />}
          {activeTab === 'newProduct' && <ProductForm />}
          {activeTab === 'reservations' && (
            <div className="rounded-2xl bg-white p-4 shadow-md sm:p-6">
              <h2 className="mb-4 text-xl font-bold">Gerenciar Reservas</h2>
              <div className="space-y-3">
                {reservations.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                    Nenhuma reserva registrada.
                  </p>
                ) : (
                  reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex flex-col gap-3 rounded-xl bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">{reservation.productName}</p>
                        <p className="text-sm text-gray-500">
                          {reservation.quantity} unidade(s) • {formatDate(reservation.pickupDate)} às{' '}
                          {reservation.pickupTime || reservation.time}
                        </p>
                        <p className="text-xs text-gray-400">
                          Total: R$ {(reservation.price || 0).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-2 py-1 text-xs font-bold ${getStatusClass(
                          reservation.status
                        )}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, valueClassName = 'text-gray-800' }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
        </div>
        <div className="text-4xl text-primary-500 opacity-50">{icon}</div>
      </div>
    </div>
  );
}
