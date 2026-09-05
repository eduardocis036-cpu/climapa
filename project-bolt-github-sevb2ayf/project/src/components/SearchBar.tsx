import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Loader2, Navigation } from 'lucide-react';
import type { GeoLocation } from '@/types';
import { searchLocations } from '@/lib/geocode';
import { PANAMA_LOCATIONS } from '@/config/panamaLocations';

interface Props {
  currentLocationName: string;
  onSelectLocation: (loc: GeoLocation) => void;
  onUseGPS: () => void;
  gpsLoading: boolean;
}

export default function SearchBar({ currentLocationName, onSelectLocation, onUseGPS, gpsLoading }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchLocations(query);
      setResults(found);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: GeoLocation) => {
    onSelectLocation(loc);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const filteredLocal = query.trim().length > 0
    ? PANAMA_LOCATIONS.filter((l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.displayName.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const combinedResults = [...filteredLocal];
  const localNames = new Set(combinedResults.map((r) => r.name));
  for (const r of results) {
    if (!localNames.has(r.name)) {
      combinedResults.push(r);
      localNames.add(r.name);
    }
  }

  return (
    <div ref={containerRef} className="relative z-50">
      <div className="flex items-center gap-2">
        <div className="glass-input flex-1 flex items-center gap-2 rounded-full px-4 py-2.5">
          <Search size={18} className="text-white/60 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={currentLocationName}
            className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none min-w-0"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="text-white/60 hover:text-white shrink-0"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

        <button
          onClick={onUseGPS}
          disabled={gpsLoading}
          className="glass-input rounded-full p-2.5 text-white/80 hover:text-white active:scale-95 transition-all shrink-0"
          aria-label="Usar GPS"
        >
          {gpsLoading ? (
            <Loader2 size={20} className="animate-spin" strokeWidth={1.5} />
          ) : (
            <Navigation size={20} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {showResults && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl overflow-hidden max-h-80 overflow-y-auto no-scrollbar animate-fade-in">
          {loading && (
            <div className="flex items-center justify-center py-4 text-white/60 text-sm">
              <Loader2 size={16} className="animate-spin mr-2" /> Buscando...
            </div>
          )}
          {!loading && combinedResults.length === 0 && (
            <div className="px-4 py-4 text-white/50 text-sm text-center">
              No se encontraron ubicaciones
            </div>
          )}
          {!loading &&
            combinedResults.map((loc, i) => (
              <button
                key={`${loc.name}-${i}`}
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
              >
                <MapPin size={16} className="text-white/40 shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{loc.name}</p>
                  <p className="text-white/40 text-xs truncate">{loc.displayName}</p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
