export default function StudentProductCard({ product, onOpenDetails }) {
  const renderTags = () => {
    const tags = [];

    if (product.dietary?.includes('CONTÉM GLÚTEN')) {
      tags.push(<span key="gluten" className="tag-gluten">CONTÉM GLÚTEN</span>);
    }
    if (product.dietary?.includes('CONTÉM LACTOSE')) {
      tags.push(<span key="lactose" className="tag-lactose">CONTÉM LACTOSE</span>);
    }
    if (product.dietary?.includes('SEM GLÚTEN')) {
      tags.push(<span key="semgluten" className="tag-sem-gluten">SEM GLÚTEN</span>);
    }
    if (product.dietary?.includes('SEM LACTOSE')) {
      tags.push(<span key="semlactose" className="tag-sem-lactose">SEM LACTOSE</span>);
    }
    if (product.dietary?.includes('SEM AÇÚCAR')) {
      tags.push(<span key="semacucar" className="tag-sem-acucar">SEM AÇÚCAR</span>);
    }

    return tags;
  };

  return (
    <button
      type="button"
      onClick={() => onOpenDetails(product)}
      className="product-card group flex min-h-[292px] w-full flex-col items-center justify-between p-5 text-center outline-none ring-primary-200 transition focus:ring-4"
    >
      <img
        src={product.image}
        alt={product.name}
        className="h-40 w-40 rounded-sm object-cover transition duration-300 group-hover:scale-[1.02] sm:h-44 sm:w-44"
      />

      <div className="mt-4 w-full">
        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
        <p className="mt-3 text-xl font-extrabold text-primary-700">
          R$ {product.price.toFixed(2).replace('.', ',')}
        </p>

        <div className="mt-4 flex min-h-7 flex-wrap justify-center gap-2">
          {renderTags()}
        </div>
      </div>
    </button>
  );
}
