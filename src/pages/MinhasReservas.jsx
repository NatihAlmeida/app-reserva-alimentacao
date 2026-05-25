import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaRegCalendarAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ProductContext, canCancelReservation } from '../context/ProductContext';
import Header from '../components/UI/Header';

const formatDate = (value) => {
  if (!value) return 'Data não informada';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const statusLabels = {
  confirmed: 'Confirmada',
  ready: 'Pronto para retirar',
  completed: 'Retirada',
  cancelled: 'Cancelada',
  not_picked_up: 'Não retirada',
  expired: 'Expirada',
  blocked: 'Bloqueada',
};

const statusClasses = {
  confirmed: 'bg-emerald-100 text-emerald-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  not_picked_up: 'bg-orange-100 text-orange-800',
  expired: 'bg-orange-100 text-orange-800',
  blocked: 'bg-red-100 text-red-800',
};

export default function MinhasReservas() {
  const { reservations, cancelReservation } = useContext(ProductContext);
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const myReservations = reservations.filter((reservation) => reservation.studentId === user?.id);
  const activeReservations = myReservations.filter(
    (reservation) => !['cancelled', 'completed', 'not_picked_up'].includes(reservation.status)
  );
  const completedReservations = myReservations.filter((reservation) =>
    ['completed', 'cancelled', 'not_picked_up'].includes(reservation.status)
  );

  const handleCancel = (reservation) => {
    const result = cancelReservation(reservation.id);

    if (!result.success) {
      addNotification(result.message, 'warning', 'student', { userId: user?.id });
      return;
    }

    addNotification('Reserva cancelada com sucesso.', 'success', 'student', { userId: user?.id });
    addNotification(
      `${user?.name || 'Aluno'} cancelou a reserva de ${reservation.productName}.`,
      'warning',
      'admin'
    );
  };

  return (
    <>
      <Header title="Minhas Reservas" />

      <main className="container-custom py-6 pb-24">
        {user?.blocked && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Your account has been temporarily blocked. Please contact the cafeteria.
          </div>
        )}

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
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">Nenhuma reserva ativa no momento</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mt-3 font-semibold text-primary-600 hover:text-primary-700"
              >
                Fazer nova reserva →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onCancel={() => handleCancel(reservation)}
                />
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
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">{reservation.productName}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(reservation.pickupDate)} às{' '}
                      {reservation.pickupTime || reservation.time}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                      statusClasses[reservation.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[reservation.status] || 'Confirmada'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function ReservationCard({ reservation, onCancel }) {
  const cancellable = canCancelReservation(reservation);

  return (
    <article className="rounded-2xl border-l-4 border-primary-600 bg-white p-4 shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-gray-900">{reservation.productName}</h4>
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
            {reservation.quantity} {reservation.quantity === 1 ? 'unidade' : 'unidades'}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-bold ${
            statusClasses[reservation.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusLabels[reservation.status] || 'Confirmada'}
        </span>
      </div>

      {reservation.status === 'confirmed' && (
        <div className="mt-3 border-t pt-3">
          <p className="flex items-center text-sm font-semibold text-emerald-700">
            <FaCheckCircle className="mr-1" /> Reserva confirmada.
          </p>
          <button
            type="button"
            onClick={onCancel}
            disabled={!cancellable}
            className="mt-3 h-10 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            Cancelar reserva
          </button>
          {!cancellable && (
            <p className="mt-2 text-xs font-semibold text-orange-700">
              Cancellation is only available until 12:00 PM on the reservation day.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
