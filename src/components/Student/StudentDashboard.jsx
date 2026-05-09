import { useContext, useMemo, useState } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';
import Header from '../UI/Header';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import StudentProductCard from './StudentProductCard';
import ReservationCart from './ReservationCart';
import ProductDetailsModal from './ProductDetailsModal';

export default function StudentDashboard() {
  const { products, addReservation } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const matchesSearch =
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDietary =
        selectedDietary === 'all' || product.dietary?.includes(selectedDietary);

      return matchesSearch && matchesDietary && product.status === 'active';
    });

    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }

    if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, searchTerm, selectedDietary, sortOrder]);

  const handleAddToCart = (product, quantity = 1) => {
    if (product.quantity <= 0) {
      addNotification(`Desculpe, ${product.name} está esgotado!`);
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...current, { ...product, quantity }];
    });

    setCartOpen(true);
  };

  const incrementItem = (productId) => {
    setCartItems((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementItem = (productId) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setCartItems((current) => current.filter((item) => item.id !== productId));
  };

  const handleCheckout = ({ pickupDate, pickupTime }) => {
    if (cartItems.length === 0) return;

    cartItems.forEach((item) => {
      addReservation({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        time: pickupTime,
        pickupDate,
        pickupTime,
        price: item.price * item.quantity,
        image: item.image,
      });
    });

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemSummary = cartItems
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(', ');

    addNotification(
      `Reserva confirmada para ${pickupTime}. Você pode acompanhar em Minhas Reservas.`,
      'success',
      'student'
    );
    addNotification(
      `Nova reserva confirmada: ${itemSummary} para ${pickupDate} às ${pickupTime}. Total: R$ ${total
        .toFixed(2)
        .replace('.', ',')}.`,
      'reservation',
      'admin'
    );
    setCartItems([]);
    setCartOpen(false);
  };

  return (
    <>
      <Header
        title="Cantina do Neném"
        searchSlot={<SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
      />

      <main className="container-custom py-6 pb-24">
        <FilterBar
          selectedDietary={selectedDietary}
          setSelectedDietary={setSelectedDietary}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <section className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <StudentProductCard
              key={product.id}
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
          isOpen
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}
