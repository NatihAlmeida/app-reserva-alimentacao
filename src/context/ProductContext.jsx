/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import pastelPalmito from '../assets/img/pastel-palmito.webp';
import coxinha from '../assets/img/coxinha.webp';
import sanduicheSemGluten from '../assets/img/sanduiche-sem-gluten.jpeg';
import saladaDeFruta from '../assets/img/salada de fruta.webp';

export const ProductContext = createContext();

const PRODUCT_SEED_VERSION = 'production-refactor-v3';
export const RESERVATION_DEADLINE = '12:00';
export const PICKUP_START = '18:30';
export const PICKUP_END = '21:30';

const getMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isToday = (dateValue) => {
  const today = new Date().toISOString().split('T')[0];
  return dateValue === today;
};

export const isBeforeReservationDeadline = (dateValue = new Date().toISOString().split('T')[0]) => {
  if (!isToday(dateValue)) return true;
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() < getMinutes(RESERVATION_DEADLINE);
};

export const canCancelReservation = (reservation) =>
  reservation.status === 'confirmed' && isBeforeReservationDeadline(reservation.pickupDate);

const isPastPickupWindow = (reservation) => {
  if (!reservation.pickupDate) return false;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (reservation.pickupDate < today) return true;
  if (reservation.pickupDate > today) return false;
  return now.getHours() * 60 + now.getMinutes() > getMinutes(PICKUP_END);
};

const normalizeReservation = (reservation) => {
  const createdDate = reservation.createdAt
    ? new Date(reservation.createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    ...reservation,
    status: reservation.status === 'pending' ? 'confirmed' : reservation.status,
    pickupDate: reservation.pickupDate || createdDate,
    pickupTime: reservation.pickupTime || reservation.time || PICKUP_START,
    time: reservation.pickupTime || reservation.time || PICKUP_START,
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
  const { user } = useContext(AuthContext);
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
    if (storedRes) return JSON.parse(storedRes).map(normalizeReservation);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    const expirationTimer = setTimeout(() => {
      setReservations((currentReservations) => {
        const nextReservations = currentReservations.map((reservation) =>
          reservation.status === 'confirmed' && isPastPickupWindow(reservation)
            ? { ...reservation, status: 'not_picked_up', expiredAt: new Date().toISOString() }
            : reservation
        );
        return JSON.stringify(nextReservations) === JSON.stringify(currentReservations)
          ? currentReservations
          : nextReservations;
      });
    }, 0);

    const updatedReservations = reservations.map((reservation) =>
      reservation.status === 'confirmed' && isPastPickupWindow(reservation)
        ? { ...reservation, status: 'not_picked_up', expiredAt: new Date().toISOString() }
        : reservation
    );

    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    return () => clearTimeout(expirationTimer);
  }, [reservations]);

  const addProduct = (product) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id, updatedProduct) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, ...updatedProduct } : product))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const addReservation = (reservation) => {
    if (!isBeforeReservationDeadline(reservation.pickupDate)) {
      return {
        success: false,
        message: 'Reservations for today closed at 12:00 PM.',
      };
    }

    const newReservation = {
      ...reservation,
      id: Date.now() + Math.random(),
      studentId: reservation.studentId || user?.id,
      studentName: reservation.studentName || user?.name,
      studentEmail: reservation.studentEmail || user?.email,
      studentProfilePicture: reservation.studentProfilePicture || user?.profilePicture || '',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setReservations((prev) => [...prev, newReservation]);
    return { success: true, reservation: newReservation };
  };

  const updateReservationStatus = (id, status) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === id ? { ...res, status, updatedAt: new Date().toISOString() } : res
      )
    );
  };

  const cancelReservation = (id) => {
    const reservation = reservations.find((item) => item.id === id);

    if (!reservation) {
      return { success: false, message: 'Reserva não encontrada.' };
    }

    if (!canCancelReservation(reservation)) {
      return {
        success: false,
        message: 'Cancellation is only available until 12:00 PM on the reservation day.',
      };
    }

    updateReservationStatus(id, 'cancelled');
    return { success: true, reservation: { ...reservation, status: 'cancelled' } };
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
        cancelReservation,
        isBeforeReservationDeadline,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
