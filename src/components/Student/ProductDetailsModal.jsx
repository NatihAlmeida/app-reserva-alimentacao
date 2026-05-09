import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function ProductDetailsModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const total = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Fechar detalhes"
      />

      <section className="relative max-h-[94vh] w-full max-w-[500px] overflow-y-auto rounded-[24px] bg-white px-4 py-6 shadow-2xl sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
          aria-label="Fechar"
        >
          <FaTimes />
        </button>

        <h2 className="pr-14 text-2xl font-extrabold text-gray-900 sm:text-[26px]">
          {product.name}
        </h2>

        <img
          src={product.image}
          alt={product.name}
          className="mx-auto mt-4 h-56 w-full max-w-[300px] rounded-sm object-cover sm:h-[220px]"
        />

        <p className="mt-5 text-sm leading-6 text-gray-600 sm:text-base">
          <strong className="font-extrabold text-gray-700">Ingredientes:</strong>{' '}
          {product.ingredients || product.description}
        </p>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="inline-flex h-11 w-fit items-center rounded-full bg-gray-50">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="grid h-11 w-10 place-items-center text-lg font-bold text-primary-700"
              aria-label="Diminuir quantidade"
            >
              -
            </button>
            <span className="grid h-11 w-8 place-items-center text-lg font-extrabold text-gray-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((current) => current + 1)}
              className="grid h-11 w-10 place-items-center text-lg font-bold text-primary-700"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onAddToCart(product, quantity);
              onClose();
            }}
            className="flex min-h-[52px] flex-1 items-center justify-between rounded-full bg-primary-700 px-6 py-4 text-base font-extrabold text-white transition hover:bg-primary-800"
          >
            <span>Adicionar</span>
            <span>R$ {total.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
