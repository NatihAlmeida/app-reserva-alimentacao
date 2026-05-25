const tagClass = {
  'CONTÉM GLÚTEN': 'tag-gluten',
  'CONTÉM LACTOSE': 'tag-lactose',
  'SEM GLÚTEN': 'tag-sem-gluten',
  'SEM LACTOSE': 'tag-sem-lactose',
  'SEM AÇÚCAR': 'tag-sem-acucar',
};

export default function StudentProductCard({ product, onOpenDetails }) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetails(product)}
      className="product-card group flex min-h-[292px] w-full flex-col items-center justify-between p-5 text-center outline-none ring-primary-200 transition focus:ring-4"
    >
      <img
        src={product.image}
        alt={product.name}
        className="h-40 w-40 rounded-lg object-cover transition duration-300 group-hover:scale-[1.02] sm:h-44 sm:w-44"
      />

      <div className="mt-4 w-full">
        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
        <p className="mt-3 text-xl font-extrabold text-primary-700">
          R$ {product.price.toFixed(2).replace('.', ',')}
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
