const filters = [
  { id: 'all', label: 'Todos' },
  { id: 'SEM GLÚTEN', label: 'Sem Glúten' },
  { id: 'SEM LACTOSE', label: 'Sem Lactose' },
  { id: 'SEM AÇÚCAR', label: 'Sem Açúcar' },
];

export default function FilterBar({
  selectedDietary,
  setSelectedDietary,
  sortOrder,
  setSortOrder,
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="h-11 shrink-0 rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 outline-none transition hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      >
        <option value="default">Ordenar</option>
        <option value="price-asc">Menor Preço</option>
        <option value="price-desc">Maior Preço</option>
      </select>

      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => setSelectedDietary(filter.id)}
          className={`h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition-all ${
            selectedDietary === filter.id
              ? 'bg-primary-700 text-white shadow-sm'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:text-primary-700'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
