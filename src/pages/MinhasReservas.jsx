import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config'; // Ajuste o caminho do seu firebase
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function MinhasReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    async function buscarReservas() {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, 'pedidos'), where('alunoID', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const listaReservas = [];
        querySnapshot.forEach((doc) => {
          listaReservas.push({ id: doc.id, ...doc.data() });
        });
        // Ordena por criação mais recente
        listaReservas.sort((a, b) => b.criadoEm?.seconds - a.criadoEm?.seconds);
        setReservas(listaReservas);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      } finally {
        setLoading(false);
      }
    }
    buscarReservas();
  }, [user]);

  // Validação da regra das 18h do dia anterior
  const podeCancelar = (dataString) => {
    try {
      // dataString esperado: "dd-mm-yyyy"
      const [dia, mes, ano] = dataString.split('-').map(Number);
      const dataReserva = new Date(ano, mes - 1, dia);
      
      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

      // Se o dia da reserva já passou ou é hoje, não pode mais cancelar por esta regra estrita
      if (hoje >= dataReserva) {
        return false;
      }

      // Se for o dia anterior à reserva, verifica se já passou das 18h
      const limiteCancelamento = new Date(dataReserva);
      limiteCancelamento.setDate(limiteCancelamento.getDate() - 1);
      limiteCancelamento.setHours(18, 0, 0, 0);

      return agora < limiteCancelamento;
    } catch (e) {
      return false;
    }
  };

  const lidarComCancelamento = async (pedidoId, dataReserva) => {
    if (!podeCancelar(dataReserva)) {
      setMensagem({ tipo: 'erro', texto: 'Cancelamentos só são permitidos até as 18h do dia anterior à reserva.' });
      return;
    }

    if (window.confirm("Tem certeza que deseja cancelar esta reserva?")) {
      try {
        const pedidoRef = doc(db, 'pedidos', pedidoId);
        await updateDoc(pedidoRef, { status: 'cancelado' });
        
        setReservas(prev => prev.map(res => res.id === pedidoId ? { ...res, status: 'cancelado' } : res));
        setMensagem({ tipo: 'sucesso', texto: 'Reserva cancelada com sucesso.' });
      } catch (error) {
        setMensagem({ tipo: 'erro', texto: 'Erro ao tentar cancelar a reserva. Tente novamente.' });
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando suas reservas...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-emerald-800">Minhas Reservas</h1>
      
      {mensagem.texto && (
        <div className={`p-4 mb-4 rounded-md ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensagem.texto}
        </div>
      )}

      {reservas.length === 0 ? (
        <p className="text-gray-600">Você ainda não realizou nenhum pedido de refeição.</p>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
              <div className="flex justify-between items-start border-b pb-3 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Data de Entrega: <span className="font-semibold text-gray-700">{reserva.data} às {reserva.hora}</span></p>
                  <p className="text-xs text-gray-400">ID do Pedido: {reserva.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  reserva.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                  reserva.status === 'preparando' ? 'bg-blue-100 text-blue-800' :
                  reserva.status === 'pronto' ? 'bg-indigo-100 text-indigo-800' :
                  reserva.status === 'entregue' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {reserva.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Itens Solicitados:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  {reserva.produtos?.map((prod, index) => (
                    <li key={index}>
                      {prod.nome} (x{prod.Quantidade}) - R$ {prod.Valor?.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-bold text-emerald-700">Total: R$ {reserva.total?.toFixed(2)}</p>
                
                {reserva.status === 'pendente' && podeCancelar(reserva.data) && (
                  <button
                    onClick={() => lidarComCancelamento(reserva.id, reserva.data)}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 px-4 rounded transition-colors text-sm"
                  >
                    Cancelar Reserva
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}