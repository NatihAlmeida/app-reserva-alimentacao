import { useContext, useMemo, useState } from 'react';
import { FaCloudUploadAlt, FaMinus, FaPlus } from 'react-icons/fa';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';
import { auth } from '../../firebase/config';
const emptyProduct = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'Salgados',
  imagemUrl: '',
  disponivel: true,
  quantidade: 10,
  temGlutem: false,
  temLactose: false,
  temAcucarAlto: false,
};

const categories = ['Salgados', 'Doces', 'Bebidas', 'Lanches'];

export default function ProductForm({ productToEdit, onClose }) {
  const { addProduct, updateProduct } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  
  const [formData, setFormData] = useState(() =>
    productToEdit
      ? {
          nome: productToEdit.nome || '',
          descricao: productToEdit.description || productToEdit.descricao || '',
          preco: productToEdit.preco || productToEdit.price || '',
          categoria: productToEdit.category || productToEdit.categoria || 'Salgados',
          imagemUrl: productToEdit.imagemUrl || productToEdit.image || '',
          disponivel: productToEdit.disponivel ?? true,
          quantidade: productToEdit.quantity || productToEdit.quantidade || 0,
          temGlutem: productToEdit.temGlutem ?? false,
          temLactose: productToEdit.temLactose ?? false,
          temAcucarAlto: productToEdit.temAcucarAlto ?? false,
        }
      : emptyProduct
  );
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const imagePreview = useMemo(() => formData.imagemUrl || '', [formData.imagemUrl]);

  const validate = () => {
    const nextErrors = {};
    if (!formData.nome.trim()) nextErrors.nome = 'Informe o nome do produto.';
    if (!formData.descricao.trim()) nextErrors.descricao = 'Informe uma descrição.';
    if (!formData.preco || Number(formData.preco) <= 0) nextErrors.preco = 'Informe um preço válido.';
    if (Number(formData.quantidade) < 0) nextErrors.quantidade = 'Quantidade inválida.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    console.log("QUEM ESTÁ TENTANDO CRIAR O PRODUTO?:", auth.currentUser?.uid);
    if (!validate()) return;

    // Normalização exata para o formato que a coleção 'produtos' exige no Firestore
    const productData = {
      nome: formData.nome,
      descricao: formData.descricao,
      preco: Number(formData.preco),
      categoria: formData.categoria,
      imagemUrl: formData.imagemUrl,
      disponivel: formData.disponivel,
      quantidade: Number(formData.quantidade),
      temGlutem: formData.temGlutem,
      temLactose: formData.temLactose,
      temAcucarAlto: formData.temAcucarAlto,
    };

    try {
      if (productToEdit) {
        await updateProduct(productToEdit.produtosID || productToEdit.id, productData);
        addNotification(`${productData.nome} atualizado no Firestore!`, 'success', 'admin');
        setSuccess('Produto atualizado com sucesso.');
      } else {
        await addProduct(productData);
        addNotification(`${productData.nome} cadastrado no Firestore!`, 'success', 'admin');
        setFormData(emptyProduct);
        setSuccess('Produto adicionado com sucesso.');
      }
      onClose?.();
    } catch (err) {
      console.error(err);
      setErrors({ global: "Erro ao sincronizar com o Firebase." });
    }
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Field label="Nome do Produto no Menu" error={errors.nome}>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-primary-500"
            />
          </Field>

          <Field label="Descrição Técnica / Ingredientes" error={errors.descricao}>
            <textarea
              rows="4"
              value={formData.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-primary-500 min-h-24 resize-y"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço de Venda (R$)" error={errors.preco}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => updateField('preco', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-primary-500"
              />
            </Field>

            <Field label="Categoria do Menu">
              <select
                value={formData.categoria}
                onChange={(e) => updateField('categoria', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantidade em Estoque" error={errors.quantidade}>
              <div className="flex h-12 rounded-xl border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => updateField('quantidade', Math.max(0, Number(formData.quantidade) - 1))}
                  className="grid w-12 place-items-center text-gray-600 hover:text-primary-700"
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={formData.quantidade}
                  onChange={(e) => updateField('quantidade', e.target.value)}
                  className="w-full border-0 text-center font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateField('quantidade', Number(formData.quantidade) + 1)}
                  className="grid w-12 place-items-center text-gray-600 hover:text-primary-700"
                >
                  <FaPlus />
                </button>
              </div>
            </Field>

            <Field label="Visibilidade Inicial">
              <select
                value={formData.disponivel ? "true" : "false"}
                onChange={(e) => updateField('disponivel', e.target.value === "true")}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500"
              >
                <option value="true">Disponível para os Alunos</option>
                <option value="false">Oculto / Indisponível</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Link da Imagem do Produto">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-4 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-44 w-full rounded-xl object-cover" />
              ) : (
                <div className="py-6">
                  <FaCloudUploadAlt className="text-4xl text-primary-600 mx-auto" />
                  <span className="mt-3 block text-sm font-bold text-gray-700">Preview Indisponível</span>
                </div>
              )}
            </div>
            <input
              type="url"
              placeholder="Cole a URL da imagem da nuvem (Firebase Storage / Web)"
              value={formData.imagemUrl}
              onChange={(e) => updateField('imagemUrl', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-primary-500 mt-3"
            />
          </Field>

          <div>
            <span className="text-sm font-bold text-gray-700">Selos Nutricionais (Restrições)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateField('temGlutem', !formData.temGlutem)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${formData.temGlutem ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Contém Glúten
              </button>
              <button
                type="button"
                onClick={() => updateField('temLactose', !formData.temLactose)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${formData.temLactose ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Contém Lactose
              </button>
              <button
                type="button"
                onClick={() => updateField('temAcucarAlto', !formData.temAcucarAlto)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${formData.temAcucarAlto ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Alto Teor de Açúcar
              </button>
            </div>
          </div>
        </div>
      </div>

      {success && <p className="mt-4 text-sm font-bold text-emerald-700">{success}</p>}
      {errors.global && <p className="mt-4 text-sm font-bold text-red-600">{errors.global}</p>}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary">
            Voltar ao Menu
          </button>
        )}
        <button type="submit" className="bg-primary-700 text-white rounded-xl font-bold text-sm px-6 h-12 hover:bg-primary-800 transition sm:min-w-48">
          {productToEdit ? 'Salvar Alterações' : 'Publicar Produto'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}