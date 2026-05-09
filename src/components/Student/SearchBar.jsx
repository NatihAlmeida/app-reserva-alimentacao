import { FaSearch } from 'react-icons/fa';

export default function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="relative w-full">
      <FaSearch className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/85" />
      <input
        type="text"
        placeholder="O que você procura?"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-11 w-full rounded-full border-0 bg-white/20 px-5 pr-12 text-sm text-white placeholder:text-white/75 outline-none ring-1 ring-white/10 transition focus:bg-white/25 focus:ring-white/25"
      />
    </div>
  );
}
