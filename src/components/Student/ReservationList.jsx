import React, { useContext, useState } from 'react';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';
import { FaChevronDown, FaChevronUp, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function ReservationList() {
  const { reservations, updateReservationStatus } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeReservations = reservations.filter(r => r.status !== 'cancelled');
  const completedReservations = reservations.filter(r => r.status === 'completed');

  if (reservations.length === 0) {
    return null;
  }

  const cancelReservation = (id, name) => {
    updateReservationStatus(id, 'cancelled');
    addNotification(`Reserva de ${name} foi cancelada`, 'warning');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-primary-600 text-white py-3 flex items-center justify-center space-x-2 hover:bg-primary-700 transition-colors"
      >
        <span>Minhas Reservas ({activeReservations.length})</span>
        {isExpanded ? <FaChevronDown /> : <FaChevronUp />}
      </button>
      
      {isExpanded && (
        <div className="bg-white shadow-2xl rounded-t-3xl max-h-96 overflow-y-auto animate-slideIn">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-3">Reservas Ativas</h3>
            {activeReservations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma reserva ativa</p>
            ) : (
              <div className="space-y-3">
                {activeReservations.map(res => (
                  <div key={res.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{res.productName}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                          <FaClock size={12} />
                          <span>{res.time}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {res.status === 'pending' && (
                          <button
                            onClick={() => cancelReservation(res.id, res.productName)}
                            className="text-red-500 text-sm"
                          >
                            <FaTimesCircle />
                          </button>
                        )}
                        {res.status === 'ready' && (
                          <span className="text-green-600 text-sm flex items-center">
                            <FaCheckCircle className="mr-1" /> Pronto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {completedReservations.length > 0 && (
              <>
                <h3 className="font-bold text-lg mt-4 mb-3">Histórico</h3>
                <div className="space-y-2">
                  {completedReservations.map(res => (
                    <div key={res.id} className="text-sm text-gray-500 pl-3 border-l-2 border-gray-200">
                      {res.productName} • {res.time}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}