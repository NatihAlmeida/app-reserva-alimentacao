import { useContext, useState } from 'react';
import { FaEdit, FaTrash, FaToggleOff, FaToggleOn } from 'react-icons/fa';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';
import Modal from '../UI/Modal';
import ProductForm from './ProductForm';

export default function ProductCard({ product }) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateProduct, deleteProduct } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);

  // Normalização do status ativo/inativo baseando-se no campo booleano 'disponivel'
  const isCurrentlyActive = product.disponivel ?? (product.status === 'active');

  const toggleStatus = () => {
    const nextAvailability = !isCurrentlyActive;
    updateProduct(product.produtosID || product.id, { 
      disponivel: nextAvailability,
      status: nextAvailability ? 'active' : 'inactive'
    });
    addNotification(
      `${product.nome} ${nextAvailability ? 'ativado' : 'desativado'} no cardápio!`,
      'success',
      'admin'
    );
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja remover ${product.nome}?`)) {
      deleteProduct(product.produtosID || product.id);
      addNotification(`${product.nome} removido permanentemente`, 'warning', 'admin');
    }
  };

  return (
    <>
      <article className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-4 transition hover:bg-white hover:shadow-md sm:flex-row sm:items-center">
        {product.imagemUrl && (
          <img src={product.imagemUrl} alt={product.nome} className="h-16 w-16 rounded-xl object-cover" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-gray-900">{product.nome}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                isCurrentlyActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isCurrentlyActive ? 'Disponível' : 'Oculto'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            R$ {Number(product.preco || 0).toFixed(2).replace('.', ',')} • {product.categoria || 'Geral'}
          </p>
          <p className="text-xs font-semibold text-gray-400">Estoque atual: {product.quantidade} un</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex">
          <IconButton onClick={toggleStatus} label="Alternar disponibilidade">
            {isCurrentlyActive ? (
              <FaToggleOn className="text-xl text-green-600" />
            ) : (
              <FaToggleOff className="text-xl text-gray-400" />
            )}
          </IconButton>
          <IconButton onClick={() => setIsEditing(true)} label="Editar produto">
            <FaEdit className="text-blue-600" />
          </IconButton>
          <IconButton onClick={handleDelete} label="Remover produto">
            <FaTrash className="text-red-600" />
          </IconButton>
        </div>
      </article>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Editar Produto">
        <ProductForm productToEdit={product} onClose={() => setIsEditing(false)} />
      </Modal>
    </>
  );
}

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-11 min-w-11 place-items-center rounded-xl bg-white text-gray-600 shadow-sm transition hover:bg-gray-100"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}