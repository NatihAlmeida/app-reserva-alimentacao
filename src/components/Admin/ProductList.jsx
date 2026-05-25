import { useContext, useState } from 'react';
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
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Gerenciar Produtos</h2>
        <div className="relative w-full sm:max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
