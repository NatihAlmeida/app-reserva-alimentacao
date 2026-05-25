import { useMemo, useState } from 'react';
import { FaCalendarAlt, FaClock, FaRegTrashAlt, FaShoppingBag, FaTimes } from 'react-icons/fa';

const pickupTimes = [
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
];

const getTodayInputValue = () => new Date().toISOString().split('T')[0];

export default function ReservationCart({
  items,
  isOpen,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckout,
}) {
  const [pickupDate, setPickupDate] = useState(getTodayInputValue);
  const [pickupTime, setPickupTime] = useState('18:30');
  const [checkoutError, setCheckoutError] = useState('');
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const formattedDate = useMemo(() => {
    if (!pickupDate) return '';
    const [year, month, day] = pickupDate.split('-');
    return `${day}/${month}/${year}`;
  }, [pickupDate]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (!pickupDate || !pickupTime) {
      setCheckoutError('Escolha a data e o horário de retirada.');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    const afterNoon = now.getHours() * 60 + now.getMinutes() >= 12 * 60;

    if (pickupDate === currentDate && afterNoon) {
      setCheckoutError('Reservations for today closed at 12:00 PM.');
      return;
    }

    setCheckoutError('');
    onCheckout({ pickupDate, pickupTime });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/45" onClick={onClose} />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex h-20 items-center justify-between border-b px-5">
          <h2 className="flex items-center gap-3 text-base font-extrabold uppercase text-gray-900">
            <FaShoppingBag size={15} />
            Carrinho
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-gray-900 transition hover:bg-gray-100"
            aria-label="Fechar carrinho"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center py-12 text-center">
              <div>
                <p className="font-semibold text-gray-800">Seu carrinho está vazio</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 text-sm font-semibold text-primary-600 underline"
                >
                  Continuar comprando
                </button>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b py-5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-[70px] w-[70px] rounded-md object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-extrabold text-gray-800">{item.name}</h3>
                  <p className="mt-1 text-base font-extrabold text-primary-700">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex h-8 items-center rounded bg-gray-50">
                      <button
                        type="button"
                        onClick={() => onDecrement(item.id)}
                        className="grid h-8 w-9 place-items-center text-lg font-bold text-gray-900 transition hover:bg-gray-100"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        -
                      </button>
                      <span className="grid h-8 w-8 place-items-center text-sm text-gray-700">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrement(item.id)}
                        className="grid h-8 w-9 place-items-center text-sm font-bold text-gray-900 transition hover:bg-gray-100"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="grid h-8 w-8 place-items-center text-gray-400 transition hover:text-red-500"
                      aria-label={`Remover ${item.name}`}
                    >
                      <FaRegTrashAlt size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t bg-white px-5 py-6">
          {items.length > 0 && (
            <div className="mb-5 rounded-2xl bg-gray-50 p-4">
              <h3 className="text-sm font-extrabold text-gray-900">Retirada da reserva</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-xs font-bold text-gray-600">
                    <FaCalendarAlt className="text-primary-600" />
                    Data
                  </span>
                  <input
                    type="date"
                    min={getTodayInputValue()}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-xs font-bold text-gray-600">
                    <FaClock className="text-primary-600" />
                    Horário
                  </span>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  >
                    {pickupTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-xs font-semibold text-primary-700">
                Retirada em {formattedDate} às {pickupTime}
              </p>
              {checkoutError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{checkoutError}</p>
              )}
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="mt-3 flex justify-between text-lg font-extrabold uppercase text-gray-900">
            <span>Total</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="mt-5 h-12 w-full rounded-lg bg-emerald-500 text-sm font-extrabold uppercase text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Finalizar reserva
          </button>

          {items.length > 0 && (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-sm text-gray-600 underline transition hover:text-primary-700"
            >
              Continuar comprando
            </button>
          )}

          {itemCount > 0 && (
            <p className="mt-3 text-center text-xs text-gray-400">
              {itemCount} {itemCount === 1 ? 'item selecionado' : 'itens selecionados'}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
