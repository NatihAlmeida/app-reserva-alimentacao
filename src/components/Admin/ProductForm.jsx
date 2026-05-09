import React, { useState, useContext, useEffect } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';

export default function ProductForm({ productToEdit, onClose }) {
  const { addProduct, updateProduct } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Salgados',
    image: 'https://images.unsplash.com/photo-1625938144755-6ce796d9e0c0?w=300&h=200&fit=crop',
    status: 'active',
    available: true,
    time: '11:00',
    quantity: 10,
    dietary: []
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    }
  }, [productToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity)
    };
    
    if (productToEdit) {
      updateProduct(productToEdit.id, productData);
      addNotification(`${productData.name} atualizado com sucesso!`);
    } else {
      addProduct(productData);
      addNotification(`${productData.name} adicionado ao cardápio!`);
    }
    
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Produto</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          required
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Quantidade</label>
          <input
            type="number"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Horário</label>
          <input
            type="time"
            required
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-field"
          >
            <option>Salgados</option>
            <option>Doces</option>
            <option>Bebidas</option>
            <option>Lanches</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Imagem (URL)</label>
        <input
          type="url"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          className="input-field"
        />
      </div>
      
      <div className="flex space-x-4 pt-4">
        <button type="submit" className="btn-primary flex-1">
          {productToEdit ? 'Atualizar' : 'Adicionar'} Produto
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}