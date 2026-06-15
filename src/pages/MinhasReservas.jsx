import { useContext } from 'react';
import { FaShoppingBag, FaSpinner, FaBan } from 'react-icons/fa';
import { ProductContext } from '../context/ProductContext';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/UI/Header';

const statusLabels = {
  pendente: 'Pendente',
  preparando: 'Preparando',
  pronto: 'Pronto para retirar',
  entregue: 'Retirado',
  cancelled: 'Cancelado',
  cancelado: 'Cancelado',
  not_picked_up: 'Não retirado',
};

const statusClasses = {
  pendente: 'bg-amber-100 text-amber-800',
  preparando: 'bg-blue-100 text-blue-800',
  pronto: 'bg-emerald-100 text-emerald-800',
  entregue: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  cancelado: 'bg-red-100 text-red-700',
  not_picked_up: 'bg-orange-100 text-orange-800',
};

export default function MinhasReservas() {
  const { reservations, loadingReservations, updateReservationStatus } = useContext(ProductContext);
  const { user } = useContext(AuthContext);
  const absences = user?.absences || 0;

  const handleCancel = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      updateReservationStatus(id, 'cancelled');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header title="Minhas Reservas" />

      <div className="container-custom py-8">
        {user && (
          <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Reservas de</p>
            <p className="font-bold text-gray-800">{user.nome}</p>
            <p className="text-xs text-gray-400">{user.email} · Matrícula: {user.matriculaID || '—'}</p>
            {absences > 0 && (
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${absences >= 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                <FaBan size={10} />
                {absences} ausência(s) registrada(s)
                {absences >= 2 && ' — Contate o administrador'}
              </div>
            )}
          </div>
        )}

        {loadingReservations ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaSpinner className="animate-spin text-3xl mb-3 text-primary-500" />
            <p className="text-sm">Buscando suas reservas...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FaShoppingBag className="mx-auto text-4xl mb-4 opacity-50" />
            <p className="font-medium">Você ainda não tem reservas.</p>
            <p className="text-sm mt-1 text-gray-400">Faça um pedido no cardápio e ele aparecerá aqui.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reservations.map((res) => {
              const isCancelled = res.status === 'cancelled' || res.status === 'cancelado';
              return (
                <div
                  key={res.pedidosID || res.id}
                  className={`bg-white p-5 rounded-2xl border shadow-sm ${isCancelled ? 'border-red-100 opacity-80' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Pedido #{(res.pedidosID || res.id)?.slice(-6) || '---'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {res.data} às {res.hora}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClasses[res.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[res.status] || res.status}
                    </span>
                  </div>

                  {isCancelled && res.cancelledReason && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                      <FaBan className="text-red-400 shrink-0" size={12} />
                      <p className="text-xs font-semibold text-red-700">
                        Motivo do cancelamento: {res.cancelledReason}
                      </p>
                    </div>
                  )}

                  <ul className="text-sm text-gray-600 mb-4 border-t pt-3 space-y-1">
                    {res.produtos?.length > 0 ? (
                      res.produtos.map((item, idx) => {
                        const qtd = item.quantidade || item.Quantidade || 1;
                        const preco = item.preco || item.Valor || 0;
                        return (
                          <li key={idx} className="flex justify-between">
                            <span>{qtd}x {item.nome || item.name || 'Produto'}</span>
                            <span>R$ {(preco * qtd).toFixed(2).replace('.', ',')}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-gray-400 text-xs">Sem detalhes de produtos.</li>
                    )}
                  </ul>

                  <div className="flex justify-between items-center border-t pt-3 mt-1">
                    <span className="font-bold text-gray-900">
                      Total: R$ {Number(res.total).toFixed(2).replace('.', ',')}
                    </span>
                    {(res.status === 'pendente' || res.status === 'pending') && (
                      <button
                        onClick={() => handleCancel(res.pedidosID || res.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
