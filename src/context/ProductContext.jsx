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

// Valida de forma inteligente se a data é hoje ou futura
export const isBeforeReservationDeadline = (pickupDateString) => {
  const now = new Date();
  
  if (pickupDateString) {
    // Obtém a data de hoje no fuso horário local no formato "YYYY-MM-DD"
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const todayStr = `${ano}-${mes}-${dia}`;

    // Se a data escolhida for após o dia de hoje (ex: amanhã), ignora a trava das 12h
    if (pickupDateString > todayStr) {
      return true;
    }
  }

  // Se for para o próprio dia de hoje, a regra estrita das 12:00 entra em ação
  return now.getHours() * 60 + now.getMinutes() < getMinutes(RESERVATION_DEADLINE);
};

// Converte produto do Firestore para o formato usado pelo frontend
const normalizarProduto = (firestoreDoc) => ({
  id: firestoreDoc.produtosID,
  produtosID: firestoreDoc.produtosID,
  name: firestoreDoc.nome,
  nome: firestoreDoc.nome,
  // Lê "Valor" que é o campo real do Firestore
  price: firestoreDoc.Valor || firestoreDoc.preco || 0,
  preco: firestoreDoc.Valor || firestoreDoc.preco || 0,
  image: firestoreDoc.imagemUrl || "",
  imagemUrl: firestoreDoc.imagemUrl || "",
  status: (firestoreDoc["disponível"] ?? firestoreDoc.disponivel) ? "active" : "inactive",
  disponivel: firestoreDoc["disponível"] ?? firestoreDoc.disponivel ?? true,
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
  descricao: firestoreDoc.descricao || "",
  category: firestoreDoc.categoria || "Salgados",
  categoria: firestoreDoc.categoria || "Salgados",
  quantity: firestoreDoc.quantidade || 0,
  quantidade: firestoreDoc.quantidade || 0,
});

// Converte pedido do Firestore para o formato legível pelo frontend
const normalizarPedido = (firestoreDoc) => ({
  id: firestoreDoc.pedidosID || firestoreDoc.id,
  pedidosID: firestoreDoc.pedidosID || firestoreDoc.id,
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
  const { user, loading: authLoading } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(false);

  // ── Carrega produtos ──────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    if (!user.perfil) return;

    const carregarProdutos = async () => {
      setLoadingProducts(true);
      try {
        const isAdmin = user.perfil === "admin";
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
  }, [user, user?.perfil, authLoading]);

  // ── Carrega pedidos ───────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setReservations([]);
      return;
    }
    if (!user.perfil) return;

    const carregarPedidos = async () => {
      setLoadingReservations(true);
      try {
        const raw =
          user.perfil === "admin"
            ? await buscarTodosPedidos()
            : await buscarPedidosAluno(user.uid || user.id);
        setReservations(raw.map(normalizarPedido));
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
      } finally {
        setLoadingReservations(false);
      }
    };

    carregarPedidos();
  }, [user, user?.perfil, authLoading]);

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
  const addReservation = async (checkoutPayload) => {
    const pickupDate = checkoutPayload?.pickupDate || null;

    if (!isBeforeReservationDeadline(pickupDate)) {
      return {
        success: false,
        message: "Reservas para o dia de hoje encerraram às 12h.",
      };
    }

    if (!user) {
      return { success: false, message: "Usuário não autenticado." };
    }

    try {
      const cartItems = checkoutPayload.items || checkoutPayload;

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return { success: false, message: "O carrinho está vazio." };
      }

      const total = cartItems.reduce(
        (sum, item) => sum + (item.preco || item.price || 0) * (item.quantidade || item.quantity || 1),
        0
      );

      // Sincronizado para enviar propriedades com fallbacks completos e chaves unificadas
      const itensFormatadosParaOFirebase = cartItems.map((item) => ({
        produtosID: String(item.produtosID || item.id || item.produtoID || ""),
        id: String(item.produtosID || item.id || item.produtoID || ""),
        nome: String(item.nome || item.name || "Produto"),
        name: String(item.nome || item.name || "Produto"),
        preco: Number(item.preco || item.price || item.Valor || 0),
        Valor: Number(item.preco || item.price || item.Valor || 0),
        quantidade: Number(item.quantidade || item.quantity || item.Quantidade || 1),
        Quantidade: Number(item.quantidade || item.quantity || item.Quantidade || 1),
      }));

      // Blindagem contra chaves nulas ou indefinidas do usuário
      const usuarioHigienizado = {
        uid: String(user.uid || user.id || ""),
        id: String(user.uid || user.id || ""),
        nome: String(user.nome || user.name || user.displayName || "Estudante"),
        name: String(user.nome || user.name || user.displayName || "Estudante"),
        displayName: String(user.nome || user.name || user.displayName || "Estudante"),
        email: String(user.email || ""),
        perfil: String(user.perfil || user.role || "student"),
        role: String(user.perfil || user.role || "student"),
      };

      // Passa os objetos blindados e compatíveis
      const pedidoID = await criarPedidoCantina(usuarioHigienizado, itensFormatadosParaOFirebase, total);

      // Formata os dados de data e hora locais para o state do frontend
      const dataFormatada = checkoutPayload.pickupDate 
        ? checkoutPayload.pickupDate.split('-').reverse().join('-') 
        : new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");

      const horaFormatada = checkoutPayload.pickupTime || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      const novoPedido = normalizarPedido({
        pedidosID: pedidoID,
        id: pedidoID,
        alunoID: usuarioHigienizado.uid,
        alunoNome: usuarioHigienizado.nome,
        produtos: itensFormatadosParaOFirebase,
        status: "pendente",
        total,
        data: dataFormatada,
        hora: horaFormatada,
        criadoEm: new Date()
      });

      setReservations((prev) => [novoPedido, ...prev]);
      return { success: true, reservation: novoPedido };
    } catch (error) {
      console.error("Erro ao criar pedido no contexto unificado:", error);
      return { success: false, message: "Erro ao processar pedido." };
    }
  };

  // ── Atuais status ────────────────────────────────────────────────────
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