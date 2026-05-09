import { createContext, useEffect, useState } from 'react';
import pastelPalmito from '../assets/img/pastel-palmito.webp';
import coxinha from '../assets/img/coxinha.webp';
import sanduicheSemGluten from '../assets/img/sanduiche-sem-gluten.jpeg';
import saladaDeFruta from '../assets/img/salada de fruta.webp';

export const ProductContext = createContext();

const PRODUCT_SEED_VERSION = 'green-reference-v2';

const normalizeReservation = (reservation) => {
  const createdDate = reservation.createdAt
    ? new Date(reservation.createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    ...reservation,
    status: reservation.status === 'pending' ? 'confirmed' : reservation.status,
    pickupDate: reservation.pickupDate || createdDate,
    pickupTime: reservation.pickupTime || reservation.time || '17:00',
    time: reservation.pickupTime || reservation.time || '17:00',
  };
};

const initialProducts = [
  {
    id: 1,
    name: 'Pastel de Palmito',
    description: 'Massa crocante e dourada, recheada com palmito cremoso e temperos especiais.',
    ingredients: 'Massa crocante tradicional frita, recheio cremoso de palmito com azeitonas e temperos da casa.',
    price: 9.5,
    category: 'Salgados',
    image: pastelPalmito,
    status: 'active',
    available: true,
    time: '11:00',
    quantity: 15,
    dietary: ['CONTÉM GLÚTEN', 'SEM LACTOSE'],
  },
  {
    id: 2,
    name: 'Coxinha de Frango',
    description: 'Frango desfiado bem temperado, empanado e frito na hora.',
    ingredients: 'Massa de batata empanada, recheio farto de frango desfiado com um toque de requeijão.',
    price: 8,
    category: 'Salgados',
    image: coxinha,
    status: 'active',
    available: true,
    time: '11:30',
    quantity: 20,
    dietary: ['CONTÉM GLÚTEN'],
  },
  {
    id: 3,
    name: 'Sanduíche Natural',
    description: 'Pão leve com recheio fresco, folhas e ingredientes selecionados.',
    ingredients: 'Pão de forma artesanal sem glúten, patê de frango com maionese light, cenoura ralada e alface americana.',
    price: 12,
    category: 'Lanches',
    image: sanduicheSemGluten,
    status: 'active',
    available: true,
    time: '10:30',
    quantity: 18,
    dietary: ['SEM GLÚTEN', 'SEM LACTOSE'],
  },
  {
    id: 4,
    name: 'Salada de Frutas',
    description: 'Frutas frescas cortadas no dia, servidas em porção individual.',
    ingredients: 'Mix de frutas frescas (morango, maçã, banana, mamão) acompanhado de suco de laranja natural sem açúcar.',
    price: 6,
    category: 'Doces',
    image: saladaDeFruta,
    status: 'active',
    available: true,
    time: '14:00',
    quantity: 14,
    dietary: ['SEM GLÚTEN', 'SEM LACTOSE', 'SEM AÇÚCAR'],
  },
];

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const stored = localStorage.getItem('products');
    const storedVersion = localStorage.getItem('productSeedVersion');

    if (stored && storedVersion === PRODUCT_SEED_VERSION) {
      return JSON.parse(stored);
    }

    localStorage.setItem('products', JSON.stringify(initialProducts));
    localStorage.setItem('productSeedVersion', PRODUCT_SEED_VERSION);
    return initialProducts;
  });

  const [reservations, setReservations] = useState(() => {
    const storedRes = localStorage.getItem('reservations');
    if (storedRes) {
      return JSON.parse(storedRes).map(normalizeReservation);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('reservations', JSON.stringify(reservations));
  }, [reservations]);

  const addProduct = (product) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id, updatedProduct) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, ...updatedProduct } : product
      )
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const addReservation = (reservation) => {
    const newReservation = {
      ...reservation,
      id: Date.now() + Math.random(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    setReservations((prev) => [...prev, newReservation]);
    return newReservation;
  };

  const updateReservationStatus = (id, status) => {
    setReservations((prev) =>
      prev.map((res) => (res.id === id ? { ...res, status } : res))
    );
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        reservations,
        addProduct,
        updateProduct,
        deleteProduct,
        addReservation,
        updateReservationStatus,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
