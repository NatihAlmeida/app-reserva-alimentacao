import { useContext } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaRegCalendarAlt } from 'react-icons/fa';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/UI/Header';

const formatDate = (value) => {
  if (!value) return 'Data não informada';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const getStatusLabel = (status) => {
  const labels = {
    confirmed: 'Confirmada',
    ready: 'Pronto para retirar',
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

export default function MinhasReservas() {
  const { reservations } = useContext(ProductContext);

  const activeReservations = reservations.filter(
    (reservation) => reservation.status !== 'cancelled' && reservation.status !== 'completed'
  );
  const completedReservations = reservations.filter(
    (reservation) => reservation.status === 'completed' || reservation.status === 'cancelled'
  );

  return (
    <>
      <Header title="Minhas Reservas" />

      <main className="container-custom py-6 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary-700">Acompanhe sua retirada</h2>
          <p className="text-gray-500">Gerencie suas reservas ativas e histórico</p>
        </div>

        <section className="mb-8">
          <h3 className="mb-3 flex items-center text-lg font-semibold text-gray-700">
            <FaRegCalendarAlt className="mr-2 text-primary-500" />
            Reservas Ativas
          </h3>

          {activeReservations.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-8 text-center">
              <p className="text-gray-500">Nenhuma reserva ativa no momento</p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="mt-3 text-primary-600 hover:text-primary-700"
              >
                Fazer nova reserva →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeReservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="rounded-2xl border-l-4 border-primary-600 bg-white p-4 shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-gray-900">
                        {reservation.productName}
                      </h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <p className="flex items-center gap-2">
                          <FaCalendarAlt size={12} />
                          Data: {formatDate(reservation.pickupDate)}
                        </p>
                        <p className="flex items-center gap-2">
                          <FaClock size={12} />
                          Horário: {reservation.pickupTime || reservation.time}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {reservation.quantity}{' '}
                        {reservation.quantity === 1 ? 'unidade' : 'unidades'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-bold ${getStatusClass(
                        reservation.status
                      )}`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  {reservation.status === 'confirmed' && (
                    <div className="mt-3 border-t pt-3">
                      <p className="flex items-center text-sm font-semibold text-emerald-700">
                        <FaCheckCircle className="mr-1" /> Reserva confirmada.
                      </p>
                    </div>
                  )}

                  {reservation.status === 'ready' && (
                    <div className="mt-3 border-t pt-3">
                      <p className="flex items-center text-sm text-green-600">
                        <FaCheckCircle className="mr-1" /> Seu pedido está pronto para retirada!
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {completedReservations.length > 0 && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-700">Histórico</h3>
            <div className="space-y-2">
              {completedReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                >
                  <div>
                    <p className="font-medium">{reservation.productName}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(reservation.pickupDate)} às{' '}
                      {reservation.pickupTime || reservation.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {reservation.quantity} unidade(s)
                    </p>
                    <span
                      className={`text-xs ${
                        reservation.status === 'completed'
                          ? 'text-green-600'
                          : 'text-red-500'
                      }`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
