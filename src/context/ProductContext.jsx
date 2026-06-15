/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import {
  buscarProdutosDisponiveis,
  buscarTodosProdutos,
  cadastrarNovoProduto,
  atualizarProduto,
  removerProduto,
} from "../firebase/produtos";
import {
  criarPedidoCantina,
  buscarPedidosAluno,
  buscarTodosPedidos,
  atualizarStatusPedido,
} from "../firebase/pedidos";

export const ProductContext = createContext();

export const RESERVATION_DEADLINE = "12:00";
export const PICKUP_START = "18:30";
export const PICKUP_END = "21:30";

const getMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const isBeforeReservationDeadline = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() < getMinutes(RESERVATION_DEADLINE);
};

// Converte produto do Firestore para o formato usado pelo frontend
const normalizarProduto = (firestoreDoc) => ({
  id: firestoreDoc.produtosID,
  produtosID: firestoreDoc.produtosID,
  name: firestoreDoc.nome,
  nome: firestoreDoc.nome,
  price: firestoreDoc.preco || 0,
  preco: firestoreDoc.preco || 0,
  image: firestoreDoc.imagemUrl || "",
  imagemUrl: firestoreDoc.imagemUrl || "",
  status: firestoreDoc["disponível"] ? "active" : "inactive",
  disponivel: firestoreDoc["disponível"] ?? true,
  // Alergênicos como array de strings (para o FilterBar)
  dietary: [
    firestoreDoc.temGlutem && "CONTÉM GLÚTEN",
    firestoreDoc.temLactose && "CONTÉM LACTOSE",
    firestoreDoc.temAcucarAlto && "CONTÉM AÇÚCAR ALTO",
    !firestoreDoc.temGlutem && "SEM GLÚTEN",
    !firestoreDoc.temLactose && "SEM LACTOSE",
  ].filter(Boolean),
  temGlutem: firestoreDoc.temGlutem ?? false,
  temLactose: firestoreDoc.temLactose ?? false,
  temAcucarAlto: firestoreDoc.temAcucarAlto ?? false,
  criadoEm: firestoreDoc.criadoEm,
  description: firestoreDoc.descricao || "",
  category: firestoreDoc.categoria || "Geral",
  quantity: firestoreDoc.quantidade || 0,
});

// Converte pedido do Firestore para o formato legível pelo frontend
const normalizarPedido = (firestoreDoc) => ({
  id: firestoreDoc.pedidosID,
  pedidosID: firestoreDoc.pedidosID,
  studentId: firestoreDoc.alunoID,
  studentName: firestoreDoc.alunoNome,
  alunoID: firestoreDoc.alunoID,
  alunoNome: firestoreDoc.alunoNome,
  produtos: firestoreDoc.produtos || [],
  status: firestoreDoc.status,
  total: firestoreDoc.total,
  data: firestoreDoc.data,
  hora: firestoreDoc.hora,
  criadoEm: firestoreDoc.criadoEm,
});

export const ProductProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);

  // ── Carrega produtos ao montar ──────────────────────────────────────────
  useEffect(() => {
    const carregarProdutos = async () => {
      setLoadingProducts(true);
      try {
        const isAdmin = user?.perfil === "admin";
        const raw = isAdmin
          ? await buscarTodosProdutos()
          : await buscarProdutosDisponiveis();
        setProducts(raw.map(normalizarProduto));
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    carregarProdutos();
  }, [user?.perfil]);

  // ── Carrega pedidos quando o usuário está logado ────────────────────────
  useEffect(() => {
    if (!user) {
      setReservations([]);
      return;
    }

    const carregarPedidos = async () => {
      setLoadingReservations(true);
      try {
        const raw =
          user.perfil === "admin"
            ? await buscarTodosPedidos()
            : await buscarPedidosAluno(user.matriculaID);
        setReservations(raw.map(normalizarPedido));
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
      } finally {
        setLoadingReservations(false);
      }
    };

    carregarPedidos();
  }, [user]);

  // ── CRUD Produtos (admin) ───────────────────────────────────────────────
  const addProduct = async (produto) => {
    try {
      const id = await cadastrarNovoProduto(produto);
      const novoNormalizado = normalizarProduto({ produtosID: id, ...produto });
      setProducts((prev) => [...prev, novoNormalizado]);
      return novoNormalizado;
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      throw error;
    }
  };

  const updateProduct = async (produtosID, dadosAtualizados) => {
    try {
      await atualizarProduto(produtosID, dadosAtualizados);
      setProducts((prev) =>
        prev.map((p) =>
          p.produtosID === produtosID
            ? normalizarProduto({ ...p, produtosID, ...dadosAtualizados })
            : p
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      throw error;
    }
  };

  const deleteProduct = async (produtosID) => {
    try {
      await removerProduto(produtosID);
      setProducts((prev) => prev.filter((p) => p.produtosID !== produtosID));
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      throw error;
    }
  };

  // ── Criar Pedido (aluno) ────────────────────────────────────────────────
  const addReservation = async (cartItems) => {
    if (!isBeforeReservationDeadline()) {
      return {
        success: false,
        message: "Reservas para hoje encerraram às 12h.",
      };
    }

    if (!user) {
      return { success: false, message: "Usuário não autenticado." };
    }

    try {
      const total = cartItems.reduce(
        (sum, item) => sum + (item.preco || item.price || 0) * (item.quantidade || item.quantity || 1),
        0
      );

      const pedidoID = await criarPedidoCantina(user, cartItems, total);

      const novoPedido = normalizarPedido({
        pedidosID: pedidoID,
        alunoID: user.matriculaID,
        alunoNome: user.nome,
        produtos: cartItems.map((item) => ({
          produtoID: item.produtosID || item.id,
          nome: item.nome || item.name,
          Valor: item.preco || item.price || 0,
          Quantidade: item.quantidade || item.quantity || 1,
        })),
        status: "pendente",
        total,
        data: new Date().toLocaleDateString("pt-BR").replace(/\//g, "-"),
        hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      });

      setReservations((prev) => [novoPedido, ...prev]);
      return { success: true, reservation: novoPedido };
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      return { success: false, message: "Erro ao processar pedido." };
    }
  };

  // ── Atualizar status (admin) ────────────────────────────────────────────
  const updateReservationStatus = async (pedidosID, novoStatus) => {
    try {
      await atualizarStatusPedido(pedidosID, novoStatus);
      setReservations((prev) =>
        prev.map((r) =>
          r.pedidosID === pedidosID ? { ...r, status: novoStatus } : r
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        reservations,
        loadingProducts,
        loadingReservations,
        addProduct,
        updateProduct,
        deleteProduct,
        addReservation,
        updateReservationStatus,
        isBeforeReservationDeadline,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};