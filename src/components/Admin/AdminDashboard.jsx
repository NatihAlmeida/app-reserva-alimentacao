import { useContext, useMemo, useState } from 'react';
import {
  FaBan,
  FaBell,
  FaBox,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaSearch,
  FaStore,
  FaTimesCircle,
  FaUnlock,
  FaUserSlash,
  FaUsers,
  FaIdCard,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { ProductContext } from '../../context/ProductContext';
import Sidebar, { AdminMobileNav } from './Sidebar';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import { cancelarPedido } from '../../firebase/pedidos';

const CANCEL_REASONS = [
  { value: 'fora_escala', label: 'Fora da escala de horário' },
  { value: 'material_indisponivel', label: 'Material indisponível' },
];

const statusLabels = {
  pendente: 'Pendente',
  preparando: 'Preparando',
  pronto: 'Pronto',
  entregue: 'Entregue',
  not_picked_up: 'Não retirada',
  cancelled: 'Cancelada',
};

const statusClasses = {
  pendente: 'bg-amber-100 text-amber-800',
  preparando: 'bg-blue-100 text-blue-800',
  pronto: 'bg-emerald-100 text-emerald-800',
  entregue: 'bg-slate-100 text-slate-700',
  not_picked_up: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-700',
};

const formatCurrency = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
const formatDate = (value) => {
  if (!value) return 'Data não informada';
  const [day, month, year] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { products, reservations, updateReservationStatus, loadingProducts, loadingReservations } = useContext(ProductContext);
  const { addNotification, notifications } = useContext(NotificationContext);
  const { user, getStudents, unblockStudent, registerAbsence, refreshStudents } = useContext(AuthContext);
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatus, setReservationStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [cancelModal, setCancelModal] = useState(null); // { reservation }
  const [cancelReason, setCancelReason] = useState('fora_escala');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const students = getStudents ? getStudents() : [];

  const stats = useMemo(() => ({
    activeProducts: products.filter((p) => p.disponivel || p.status === 'active').length,
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter((r) => ['pendente', 'preparando', 'pronto'].includes(r.status)).length,
    revenue: reservations
      .filter((r) => !['cancelled', 'not_picked_up'].includes(r.status))
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0),
    pendingPickups: reservations.filter((r) => r.status === 'pronto').length,
    blockedStudents: students.filter((s) => s.blocked).length,
  }), [products, reservations, students]);

  const filteredReservations = useMemo(() => {
    const term = reservationSearch.toLowerCase();
    return reservations.filter((r) => {
      const matchesProduct = r.produtos?.some((p) => p.nome?.toLowerCase().includes(term));
      const matchesStudent = r.alunoNome?.toLowerCase().includes(term);
      const matchesText = matchesProduct || matchesStudent;
      const matchesStatus = reservationStatus === 'all' || r.status === reservationStatus;
      return matchesText && matchesStatus;
    });
  }, [reservations, reservationSearch, reservationStatus]);

  const pageSize = 6;
  const paginatedReservations = filteredReservations.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / pageSize));

  const markNotPickedUp = async (reservation) => {
    updateReservationStatus(reservation.pedidosID || reservation.id, 'not_picked_up');
    const resultado = await registerAbsence(reservation.alunoID);

    const adminId = user?.uid || user?.id;
    addNotification(
      `${reservation.alunoNome} não retirou o pedido. (Ausência registrada)`,
      'warning',
      'admin',
      { adminId }
    );

    // Notifica o aluno
    addNotification(
      `Seu pedido foi marcado como não retirado. Você possui ${resultado.absences} ausência(s).`,
      'warning',
      'aluno',
      { userId: reservation.alunoID }
    );

    if (resultado.blocked) {
      addNotification(
        `${reservation.alunoNome} foi bloqueado após 2 ausências.`,
        'error',
        'admin',
        { adminId }
      );
      addNotification(
        'Seu acesso foi bloqueado devido a 2 ausências. Solicite desbloqueio ao administrador.',
        'error',
        'aluno',
        { userId: reservation.alunoID }
      );
    }
  };

  const markPickedUp = (reservation) => {
    updateReservationStatus(reservation.pedidosID || reservation.id, 'entregue');
    const adminId = user?.uid || user?.id;
    addNotification(`Reserva de ${reservation.alunoNome} marcada como entregue.`, 'success', 'admin', { adminId });
  };

  const openCancelModal = (reservation) => {
    setCancelModal({ reservation });
    setCancelReason('fora_escala');
    setCancelError('');
  };

  const handleCancelReservation = async () => {
    if (!cancelModal) return;
    setCancelLoading(true);
    setCancelError('');
    const { reservation } = cancelModal;
    const idPedido = reservation.pedidosID || reservation.id;
    const reasonLabel = CANCEL_REASONS.find((r) => r.value === cancelReason)?.label || cancelReason;

    try {
      await cancelarPedido(idPedido, reasonLabel);
      updateReservationStatus(idPedido, 'cancelled');

      const adminId = user?.uid || user?.id;
      // Notificação para o admin
      addNotification(
        `Pedido de ${reservation.alunoNome} cancelado: ${reasonLabel}.`,
        'info',
        'admin',
        { adminId }
      );
      // Notificação para o aluno
      addNotification(
        `Seu pedido foi cancelado. Motivo: ${reasonLabel}.`,
        'error',
        'aluno',
        { userId: reservation.alunoID }
      );

      setCancelModal(null);
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      const mensagem =
        err?.code === 'permission-denied'
          ? 'Permissão negada pelo Firestore. Verifique as regras de segurança da coleção "pedidos".'
          : err?.message || 'Não foi possível cancelar o pedido. Tente novamente.';
      setCancelError(mensagem);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUnblock = async (student) => {
    if (unblockStudent) {
      await unblockStudent(student.id || student.uid);
      const adminId = user?.uid || user?.id;
      addNotification(`${student.nome || student.name} foi desbloqueado.`, 'success', 'admin', { adminId });
      addNotification(
        'Seu acesso foi desbloqueado pelo administrador. Você pode fazer login novamente.',
        'success',
        'aluno',
        { userId: student.id || student.uid }
      );
    }
  };

  if (loadingProducts || loadingReservations) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-lg font-bold text-gray-600 animate-pulse">Carregando painel do banco de dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        <AdminMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">Área administrativa</p>
              <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Painel Administrativo</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                const adminId = user?.uid || user?.id;
                addNotification('Central administrativa sincronizada.', 'info', 'admin', { adminId });
              }}
              className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
              <FaBell />
              Notificar admin
            </button>
          </div>

          <StatsGrid stats={stats} />

          {activeTab === 'dashboard' && (
            <>
              <DashboardOverview
                stats={stats}
                reservations={reservations}
                students={students}
                setActiveTab={setActiveTab}
              />
              <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.7fr]">
                <ReservationManager
                  reservations={paginatedReservations}
                  search={reservationSearch}
                  setSearch={setReservationSearch}
                  status={reservationStatus}
                  setStatus={setReservationStatus}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  onPickedUp={markPickedUp}
                  onNotPickedUp={markNotPickedUp}
                  onCancel={openCancelModal}
                  onStatusChange={updateReservationStatus}
                />
                <StudentsPanel students={students} onUnblock={handleUnblock} onRefresh={refreshStudents} />
              </section>
            </>
          )}

          {activeTab === 'products' && <ProductList />}
          {activeTab === 'newProduct' && <ProductForm onClose={() => setActiveTab('products')} />}
          {activeTab === 'reservations' && (
            <ReservationManager
              reservations={paginatedReservations}
              search={reservationSearch}
              setSearch={setReservationSearch}
              status={reservationStatus}
              setStatus={setReservationStatus}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              onPickedUp={markPickedUp}
              onNotPickedUp={markNotPickedUp}
              onCancel={openCancelModal}
              onStatusChange={updateReservationStatus}
            />
          )}
          {activeTab === 'students' && (
            <StudentsPanel students={students} onUnblock={handleUnblock} onRefresh={refreshStudents} fullPage />
          )}
          {activeTab === 'notifications' && <AdminNotifications notifications={notifications} />}
          {activeTab === 'reports' && <Reports stats={stats} />}
        </main>
      </div>

      {/* Modal de cancelamento */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-gray-900">Cancelar Pedido</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pedido de <strong>{cancelModal.reservation.alunoNome}</strong>. Selecione o motivo do cancelamento:
            </p>
            <div className="mt-4 space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${cancelReason === r.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r.value}
                    checked={cancelReason === r.value}
                    onChange={() => setCancelReason(r.value)}
                    className="accent-red-600"
                  />
                  <span className="text-sm font-semibold text-gray-800">{r.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">O aluno receberá uma notificação com o motivo informado.</p>
            {cancelError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {cancelError}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancelReservation}
                disabled={cancelLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                <FaBan />
                {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <StatCard label="Produtos Ativos" value={stats.activeProducts} icon={<FaStore />} />
      <StatCard label="Total Pedidos" value={stats.totalReservations} icon={<FaBox />} />
      <StatCard label="Em Aberto" value={stats.confirmedReservations} icon={<FaUsers />} />
      <StatCard label="Receita Bruta" value={formatCurrency(stats.revenue)} icon={<FaChartLine />} />
      <StatCard label="Prontos p/ Retirada" value={stats.pendingPickups} icon={<FaClock />} />
      <StatCard label="Alunos Bloqueados" value={stats.blockedStudents} icon={<FaUserSlash />} />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-100 hover:shadow-md">
      <div className="flex min-h-16 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug text-gray-500">{label}</p>
          <p className="mt-1 break-words text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-lg text-primary-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

function DashboardOverview({ stats, reservations, students, setActiveTab }) {
  const statusSummary = Object.entries(statusLabels)
    .map(([status, label]) => ({
      status,
      label,
      total: reservations.filter((reservation) => reservation.status === status).length,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
  const nonActiveReservations = Math.max(0, stats.totalReservations - stats.confirmedReservations);
  const blockedStudents = students.filter((student) => student.blocked).length;
  const completedReservations = reservations.filter((item) => item.status === 'entregue').length;

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Resumo Operacional</h2>
            <p className="text-sm text-gray-500">Visao rapida da movimentacao atual da cantina.</p>
          </div>
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
            Hoje
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <OverviewMetric label="Reservas ativas" value={stats.confirmedReservations} tone="primary" />
          <OverviewMetric label="Finalizadas" value={completedReservations} tone="success" />
          <OverviewMetric label="Nao ativas" value={nonActiveReservations} />
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Reservas por status</h3>
          {statusSummary.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Nenhuma reserva registrada.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {statusSummary.map((item) => (
                <div key={item.status} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[item.status]}`}>
                      {item.label}
                    </span>
                    <span className="text-lg font-extrabold text-gray-900">{item.total}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${Math.max(8, (item.total / Math.max(1, stats.totalReservations)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-gray-900">Atalhos</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">Rapido</span>
          </div>
          <div className="mt-4 grid gap-2">
            <DashboardShortcut
              icon={<FaBox />}
              label="Ver reservas"
              description="Acompanhar retiradas e status."
              onClick={() => setActiveTab('reservations')}
            />
            <DashboardShortcut
              icon={<FaUsers />}
              label="Ver alunos"
              description={`${students.length} aluno(s), ${blockedStudents} bloqueado(s).`}
              onClick={() => setActiveTab('students')}
            />
            <DashboardShortcut
              icon={<FaPlus />}
              label="Novo produto"
              description="Cadastrar item no cardapio."
              onClick={() => setActiveTab('newProduct')}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-extrabold text-gray-900">Saude da operacao</h2>
          <div className="mt-4 space-y-2">
            <HealthRow label="Produtos disponiveis" value={stats.activeProducts} />
            <HealthRow label="Retiradas pendentes" value={stats.pendingPickups} />
            <HealthRow label="Alunos bloqueados" value={stats.blockedStudents} tone={stats.blockedStudents > 0 ? 'warning' : 'success'} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewMetric({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary-50 text-primary-800'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-800'
        : 'bg-gray-50 text-gray-800';

  return (
    <div className={`rounded-lg p-3 ${toneClass}`}>
      <p className="text-sm font-bold opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function DashboardShortcut({ icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-primary-100 hover:bg-primary-50"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary-700 shadow-sm transition group-hover:bg-primary-700 group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-extrabold text-gray-900">{label}</span>
        <span className="block text-sm leading-snug text-gray-500">{description}</span>
      </span>
    </button>
  );
}

function HealthRow({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'warning'
      ? 'bg-orange-100 text-orange-800'
      : tone === 'success'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-gray-100 text-gray-700';

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <span className="text-sm font-bold text-gray-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${toneClass}`}>{value}</span>
    </div>
  );
}

function ReservationManager({
  reservations, search, setSearch, status, setStatus,
  page, setPage, totalPages, onPickedUp, onNotPickedUp, onCancel, onStatusChange,
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Gerenciar Pedidos e Reservas</h2>
          <p className="text-sm text-gray-500">Acompanhe a linha de produção em tempo real.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar aluno ou produto..."
              className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-primary-500"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {reservations.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <ReservationRow
              key={reservation.pedidosID || reservation.id}
              reservation={reservation}
              onPickedUp={() => onPickedUp(reservation)}
              onNotPickedUp={() => onNotPickedUp(reservation)}
              onCancel={() => onCancel(reservation)}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50">
          Anterior
        </button>
        <span className="text-sm font-bold text-gray-500">{page} / {totalPages}</span>
        <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-50">
          Próxima
        </button>
      </div>
    </section>
  );
}

function ReservationRow({ reservation, onPickedUp, onNotPickedUp, onCancel, onStatusChange }) {
  const currentStatus = reservation.status || 'pendente';
  const idPedido = reservation.pedidosID || reservation.id;
  const canCancel = !['cancelled', 'entregue', 'not_picked_up'].includes(currentStatus);

  return (
    <article className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">
      <div className="flex items-center gap-3">
        <Avatar name={reservation.alunoNome} />
        <div className="min-w-0">
          <p className="font-extrabold text-gray-900">{reservation.alunoNome || 'Aluno'}</p>
          <p className="text-xs font-semibold text-gray-500">ID: {reservation.alunoID}</p>
        </div>
      </div>

      <div className="space-y-1">
        {reservation.produtos?.map((p, i) => (
          <p key={i} className="text-sm font-bold text-gray-800">
            {p.nome} <span className="text-gray-400 font-normal">({p.Quantidade || p.quantidade}x)</span>
          </p>
        ))}
        <p className="text-xs text-primary-700 font-bold">Total: {formatCurrency(reservation.total)}</p>
        <p className="text-xs text-gray-400">Agendado: {formatDate(reservation.data)} às {reservation.hora}</p>
        {currentStatus === 'cancelled' && reservation.cancelledReason && (
          <p className="text-xs font-semibold text-red-600">Motivo: {reservation.cancelledReason}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {['pendente', 'preparando', 'pronto'].includes(currentStatus) && (
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(idPedido, e.target.value)}
            className="h-9 rounded-xl border border-gray-300 bg-white px-2 text-xs font-bold outline-none"
          >
            <option value="pendente">Pendente</option>
            <option value="preparando">Preparando</option>
            <option value="pronto">Pronto p/ Retirada</option>
          </select>
        )}

        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[currentStatus] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabels[currentStatus] || currentStatus}
        </span>

        {currentStatus === 'pronto' && (
          <>
            <button type="button" onClick={onPickedUp} className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 transition">
              <FaCheckCircle /> Entregar
            </button>
            <button type="button" onClick={onNotPickedUp} className="inline-flex items-center gap-1 bg-white border border-orange-200 text-orange-700 rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-orange-50 transition">
              Não retirado
            </button>
          </>
        )}

        {canCancel && (
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-600 rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-red-50 transition">
            <FaTimesCircle /> Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

function StudentsPanel({ students, onUnblock, onRefresh, fullPage = false }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return students;
    return students.filter(
      (s) =>
        (s.nome || s.name || '').toLowerCase().includes(term) ||
        (s.matriculaID || '').toLowerCase().includes(term)
    );
  }, [students, search]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Alunos Registrados</h2>
          <p className="text-xs text-gray-500 mt-0.5">{students.length} aluno(s) cadastrado(s) no sistema</p>
        </div>
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="text-xs font-bold text-primary-600 hover:underline">
            Atualizar
          </button>
        )}
      </div>

      {fullPage && (
        <label className="relative mb-4 block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou matrícula..."
            className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </label>
      )}

      <div className="mt-2 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
            {search ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}
          </p>
        ) : (
          filtered.map((student) => (
            <StudentRow key={student.id || student.uid} student={student} onUnblock={onUnblock} />
          ))
        )}
      </div>
    </section>
  );
}

function StudentRow({ student, onUnblock }) {
  const absences = student.absences || 0;
  const isBlocked = !!student.blocked;

  return (
    <div className={`flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between ${isBlocked ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <Avatar name={student.nome || student.name} blocked={isBlocked} />
        <div>
          <p className="font-bold text-gray-900">{student.nome || student.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
              <FaIdCard className="text-primary-400" />
              {student.matriculaID || 'Sem matrícula'}
            </span>
            <span className="text-xs text-gray-400">{student.email}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs font-bold ${absences >= 2 ? 'text-red-600' : absences === 1 ? 'text-orange-500' : 'text-gray-400'}`}>
              {absences} ausência(s)
            </span>
            {absences > 0 && (
              <span className="flex gap-0.5">
                {[1, 2].map((i) => (
                  <span key={i} className={`inline-block h-2 w-2 rounded-full ${absences >= i ? 'bg-red-500' : 'bg-gray-200'}`} />
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-2">
        {isBlocked ? (
          <>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              Acesso Bloqueado
            </span>
            <button
              type="button"
              onClick={() => onUnblock(student)}
              className="inline-flex items-center gap-1.5 bg-primary-600 text-white font-bold text-xs px-3 py-2 rounded-xl hover:bg-primary-700 transition"
            >
              <FaUnlock /> Desbloquear
            </button>
          </>
        ) : (
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Acesso Liberado
          </span>
        )}
      </div>
    </div>
  );
}

function AdminNotifications({ notifications }) {
  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-extrabold text-gray-900">Notificações Administrativas</h2>
      <p className="text-xs text-gray-500 mt-1">Apenas notificações geradas por você nesta sessão.</p>
      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Nenhuma notificação emitida ainda.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`rounded-xl border p-4 text-sm ${typeStyles[n.type] || typeStyles.info}`}>
              <p className="font-semibold">{n.message}</p>
              <p className="text-xs opacity-60 mt-1">
                {new Date(n.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Reports({ stats }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-gray-900">Relatórios de Desempenho</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Receita Líquida" value={formatCurrency(stats.revenue)} icon={<FaChartLine />} />
        <StatCard label="Pedidos Gerados" value={stats.totalReservations} icon={<FaBox />} />
        <StatCard label="Alunos Bloqueados" value={stats.blockedStudents} icon={<FaUserSlash />} />
      </div>
    </section>
  );
}

function Avatar({ name, blocked = false }) {
  return (
    <div className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-extrabold ${blocked ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-800'}`}>
      {(name || 'A').slice(0, 1).toUpperCase()}
    </div>
  );
}
