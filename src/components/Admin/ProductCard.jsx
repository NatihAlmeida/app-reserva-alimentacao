import React, { useState, useContext } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';
import Modal from '../UI/Modal';
import ProductForm from './ProductForm';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function ProductCard({ product }) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateProduct, deleteProduct } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);

  const toggleStatus = () => {
    updateProduct(product.id, { status: product.status === 'active' ? 'inactive' : 'active' });
    addNotification(`${product.name} ${product.status === 'active' ? 'desativado' : 'ativado'} com sucesso!`);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja remover ${product.name}?`)) {
      deleteProduct(product.id);
      addNotification(`${product.name} removido do cardápio`);
    }
  };

  return (
    <>
      <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
        
        <div className="flex-1 ml-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">{product.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-300 text-gray-600'
            }`}>
              {product.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-sm text-gray-500">R$ {product.price.toFixed(2)} • {product.time}</p>
          <p className="text-xs text-gray-400">Estoque: {product.quantity} un</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleStatus}
            className="p-2 rounded-lg hover:bg-gray-200 transition"
          >
            {product.status === 'active' ? <FaToggleOn className="text-green-600 text-xl" /> : <FaToggleOff className="text-gray-400 text-xl" />}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg hover:bg-gray-200 transition text-blue-600"
          >
            <FaEdit />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-gray-200 transition text-red-600"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Editar Produto">
        <ProductForm productToEdit={product} onClose={() => setIsEditing(false)} />
      </Modal>
    </>
  );
}