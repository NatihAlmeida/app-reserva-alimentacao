import { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import { ProductContext } from '../../context/ProductContext';
import Header from '../UI/Header';
import FilterBar from './FilterBar';
import ProductDetailsModal from './ProductDetailsModal';
import ReservationCart from './ReservationCart';
import SearchBar from './SearchBar';
import StudentProductCard from './StudentProductCard';

export default function StudentDashboard() {
  const { products, addReservation } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Filtra os produtos aceitando tanto chaves em português quanto em inglês
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const itemNome = product.nome || product.name || '';
      const itemDescricao = product.descricao || product.description || '';

      const matchesSearch =
        searchTerm === '' ||
        itemNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemDescricao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDietary =
        selectedDietary === 'all' || product.dietary?.includes(selectedDietary);

      return matchesSearch && matchesDietary;
    });

    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => Number(a.preco ?? a.price ?? 0) - Number(b.preco ?? b.price ?? 0));
    }
    if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => Number(b.preco ?? b.price ?? 0) - Number(a.preco ?? a.price ?? 0));
    }

    return list;
  }, [products, searchTerm, selectedDietary, sortOrder]);

  const addToCart = (product, quantity) => {
    const productId = product.produtosID || product.id;
    setCartItems((prev) => {
      const existing = prev.find((item) => (item.produtosID || item.id) === productId);
      if (existing) {
        return prev.map((item) =>
          (item.produtosID || item.id) === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    
    const itemNome = product.nome || product.name || 'Produto';
    addNotification(`${quantity}x ${itemNome} adicionado ao carrinho`, 'info', 'student');
  };

  const incrementItem = (id) => {
    setCartItems((prev) =>
      prev.map((item) => ((item.produtosID || item.id) === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const decrementItem = (id) => {
    setCartItems((prev) =>
      prev
        .map((item) => ((item.produtosID || item.id) === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => (item.produtosID || item.id) !== id));
  };

  // 🔥 AJUSTADO: Destrava o botão, impede a notificação vazia, limpa e fecha o carrinho após o sucesso
  const handleCheckout = async (pickupDetails) => {
    if (cartItems.length === 0) return;

    // Normaliza todos os dados antes de passar para frente para não quebrar chaves de leitura futuras
    const normalizedItems = cartItems.map(item => ({
      id: item.produtosID || item.id,
      produtosID: item.produtosID || item.id,
      name: item.nome || item.name || 'Produto',
      nome: item.nome || item.name || 'Produto',
      price: Number(item.preco ?? item.price ?? 0),
      preco: Number(item.preco ?? item.price ?? 0),
      quantity: item.quantity,
      image: item.imagemUrl || item.image || '',
      imagemUrl: item.imagemUrl || item.image || ''
    }));

    try {
      // Cria a estrutura para salvar na função addReservation do seu ProductContext
      const result = await addReservation({
        items: normalizedItems,
        ...pickupDetails,
        userId: user?.id || null,
        studentName: user?.name || 'Estudante',
        timestamp: new Date().toISOString(),
      });

      // Verifica se o context retornou erro de horário limite ou outra validação interna
      if (result && result.success === false) {
        addNotification(result.message || 'Erro ao processar reserva.', 'error', 'student');
        return;
      }

      // Define o texto seguro para a caixa de mensagem
      const textoMensagem = normalizedItems.length === 1 
        ? `Sua reserva de "${normalizedItems[0].nome}" foi enviada!` 
        : `Sua reserva de ${normalizedItems.length} itens foi enviada!`;

      // Dispara a notificação de sucesso com fallbacks de segurança de Audience
      addNotification(
        textoMensagem,
        'success',
        user?.role || 'student',
        { userId: user?.id }
      );

      // Limpa e fecha com segurança
      setCartItems([]);
      setCartOpen(false);

    } catch (error) {
      console.error("Erro ao finalizar reserva:", error);
      addNotification('Ocorreu um erro ao processar sua reserva. Tente novamente.', 'error', 'student');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white shadow-lg">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Olá, {user?.name || 'Estudante'}! 👋</h1>
          <p className="mt-1 text-sm text-white/85">Faça sua reserva e retire diretamente no balcão da cantina.</p>
          <div className="mt-5 max-w-md">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </div>

        {user?.status === 'blocked' && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Sua conta está temporariamente bloqueada. Por favor, procure a administração da cantina.
          </div>
        )}

        <FilterBar
          selectedDietary={selectedDietary}
          setSelectedDietary={setSelectedDietary}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <section className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <StudentProductCard
              key={product.produtosID || product.id}
              product={product}
              onOpenDetails={setSelectedProduct}
            />
          ))}
        </section>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </main>

      <ReservationCart
        items={cartItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onRemove={removeItem}
        onCheckout={handleCheckout}
      />

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}