const tagClass = {
  'CONTÉM GLÚTEN': 'tag-gluten',
  'CONTÉM LACTOSE': 'tag-lactose',
  'SEM GLÚTEN': 'tag-sem-gluten',
  'SEM LACTOSE': 'tag-sem-lactose',
  'SEM AÇÚCAR': 'tag-sem-acucar',
};

export default function StudentProductCard({ product, onOpenDetails }) {
  const itemNome = product.nome || product.name || 'Produto';
  const itemPreco = Number(product.preco ?? product.price ?? 0);
  const itemImagem = product.imagemUrl || product.image || '';

  // Envia o objeto normalizado e seguro para quando o modal de detalhes abrir
  const normalizedProduct = {
    ...product,
    id: product.produtosID || product.id,
    name: itemNome,
    price: itemPreco,
    image: itemImagem
  };

  return (
    <button
      type="button"
      onClick={() => onOpenDetails(normalizedProduct)}
      className="product-card group flex min-h-[292px] w-full flex-col items-center justify-between p-5 text-center outline-none ring-primary-200 transition focus:ring-4"
    >
      <img
        src={itemImagem}
        alt={itemNome}
        className="h-40 w-40 rounded-lg object-cover transition duration-300 group-hover:scale-[1.02] sm:h-44 sm:w-44"
      />

      <div className="mt-4 w-full">
        <h3 className="text-lg font-bold text-gray-900">{itemNome}</h3>
        <p className="mt-3 text-xl font-extrabold text-primary-700">
          R$ {itemPreco.toFixed(2).replace('.', ',')}
        </p>

        <div className="mt-4 flex min-h-7 flex-wrap justify-center gap-2">
          {product.dietary?.map((tag) => (
            <span key={tag} className={tagClass[tag] || 'tag-sem-gluten'}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}