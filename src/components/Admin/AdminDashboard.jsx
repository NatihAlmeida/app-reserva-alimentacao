import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const buscarTodosPedidos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pedidos'));
      const listaPedidos = [];
      querySnapshot.forEach((doc) => {
        listaPedidos.push({ id: doc.id, ...doc.data() });
      });
      // Mais recentes primeiro
      listaPedidos.sort((a, b) => b.criadoEm?.seconds - a.criadoEm?.seconds);
      setPedidos(listaPedidos);
    } catch (error) {
      console.error("Erro ao buscar painel de pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarTodosPedidos();
  }, []);

  const alterarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, { status: novoStatus });
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    } catch (error) {
      alert("Erro ao atualizar o status do pedido.");
    }
  };

  const pedidosFiltrados = filtroStatus === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.status === filtroStatus);

  if (loading) return <div className="p-8 text-center">Carregando painel de administração...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Painel do Administrador - Reservas Celíacas</h1>

      {/* Filtros de Status */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['todos', 'pendente', 'preparando', 'pronto', 'entregue', 'cancelado'].map((status) => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              filtroStatus === status 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Tabela / Lista de Pedidos */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno / Detalhes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produtos Solicitados</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agendado para</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {pedidosFiltrados.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{pedido.alunoNome || "Aluno Não Identificado"}</div>
                  <div className="text-xs text-gray-400">ID: {pedido.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {pedido.produtos?.map((prod, idx) => (
                      <div key={idx} className="text-gray-700">
                        • {prod.nome} <span className="text-gray-500 font-medium">(x{prod.Quantidade})</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-900">{pedido.data}</div>
                  <div className="text-xs text-gray-500">{pedido.hora}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                  R$ {pedido.total?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    pedido.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    pedido.status === 'preparando' ? 'bg-blue-100 text-blue-800' :
                    pedido.status === 'pronto' ? 'bg-indigo-100 text-indigo-800' :
                    pedido.status === 'entregue' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pedido.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={pedido.status}
                    onChange={(e) => alterarStatusPedido(pedido.id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="preparando">Preparando</option>
                    <option value="pronto">Pronto</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
            {pedidosFiltrados.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  Nenhum pedido encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}