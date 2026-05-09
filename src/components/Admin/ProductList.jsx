import React, { useContext, useState } from 'react';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';
import { FaSearch } from 'react-icons/fa';

export default function ProductList() {
  const { products } = useContext(ProductContext);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Gerenciar Produtos</h2>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  );
}