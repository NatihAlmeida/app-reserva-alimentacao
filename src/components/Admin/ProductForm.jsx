import { useContext, useMemo, useState } from 'react';
import { FaCloudUploadAlt, FaMinus, FaPlus } from 'react-icons/fa';
import { ProductContext } from '../../context/ProductContext';
import { NotificationContext } from '../../context/NotificationContext';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  category: 'Salgados',
  image: '',
  status: 'active',
  available: true,
  time: '11:00',
  quantity: 10,
  dietary: [],
};

const categories = ['Salgados', 'Doces', 'Bebidas', 'Lanches'];
const dietaryOptions = ['CONTÉM GLÚTEN', 'CONTÉM LACTOSE', 'SEM GLÚTEN', 'SEM LACTOSE', 'SEM AÇÚCAR'];

export default function ProductForm({ productToEdit, onClose }) {
  const { addProduct, updateProduct } = useContext(ProductContext);
  const { addNotification } = useContext(NotificationContext);
  const [formData, setFormData] = useState(() =>
    productToEdit
      ? {
          ...emptyProduct,
          ...productToEdit,
          price: productToEdit.price?.toString() || '',
        }
      : emptyProduct
  );
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const imagePreview = useMemo(() => formData.image || '', [formData.image]);

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Informe o nome do produto.';
    if (!formData.description.trim()) nextErrors.description = 'Informe uma descrição.';
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = 'Informe um preço válido.';
    if (Number(formData.quantity) < 0) nextErrors.quantity = 'Quantidade não pode ser negativa.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    if (!validate()) return;

    const productData = {
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, productData);
      addNotification(`${productData.name} atualizado com sucesso!`, 'success', 'admin');
      setSuccess('Produto atualizado com sucesso.');
    } else {
      addProduct(productData);
      addNotification(`${productData.name} adicionado ao cardápio!`, 'success', 'admin');
      setFormData(emptyProduct);
      setSuccess('Produto adicionado com sucesso.');
    }

    onClose?.();
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField('image', reader.result);
    reader.readAsDataURL(file);
  };

  const toggleDietary = (option) => {
    setFormData((current) => ({
      ...current,
      dietary: current.dietary.includes(option)
        ? current.dietary.filter((item) => item !== option)
        : [...current.dietary, option],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Field label="Nome do Produto" error={errors.name}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="input-field"
            />
          </Field>

          <Field label="Descrição" error={errors.description}>
            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="input-field min-h-32 resize-y"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço (R$)" error={errors.price}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                className="input-field"
              />
            </Field>

            <Field label="Horário de preparo">
              <input
                type="time"
                value={formData.time}
                onChange={(e) => updateField('time', e.target.value)}
                className="input-field"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria">
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="input-field"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>

            <Field label="Quantidade" error={errors.quantity}>
              <div className="flex h-12 rounded-xl border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => updateField('quantity', Math.max(0, Number(formData.quantity) - 1))}
                  className="grid w-12 place-items-center text-gray-600 hover:text-primary-700"
                  aria-label="Diminuir quantidade"
                >
                  <FaMinus />
                </button>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                  className="w-full border-0 text-center font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => updateField('quantity', Number(formData.quantity) + 1)}
                  className="grid w-12 place-items-center text-gray-600 hover:text-primary-700"
                  aria-label="Aumentar quantidade"
                >
                  <FaPlus />
                </button>
              </div>
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Imagem do produto">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-4 text-center transition hover:border-primary-500"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Prévia do produto"
                  className="h-44 w-full rounded-xl object-cover"
                />
              ) : (
                <>
                  <FaCloudUploadAlt className="text-4xl text-primary-600" />
                  <span className="mt-3 text-sm font-bold text-gray-700">
                    Arraste uma imagem ou toque para escolher
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            <input
              type="url"
              placeholder="Ou cole uma URL da imagem"
              value={formData.image.startsWith('data:') ? '' : formData.image}
              onChange={(e) => updateField('image', e.target.value)}
              className="input-field mt-3"
            />
          </Field>

          <div>
            <span className="text-sm font-bold text-gray-700">Selos alimentares</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    formData.dietary.includes(option)
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-primary-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {success && <p className="mt-4 text-sm font-bold text-emerald-700">{success}</p>}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary min-h-12 sm:min-w-48">
          {productToEdit ? 'Atualizar Produto' : 'Adicionar Produto'}
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
