import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Loader2, House, Plus, Trash2, Navigation } from 'lucide-react';
import type { SavedLocation, WeatherData } from '@/types';
import { searchLocations } from '@/lib/geocode';
import { fetchWeather } from '@/lib/weatherApi';
import WeatherIcon from './WeatherIcon';
import DynamicBackground from './DynamicBackground';

interface Props {
  locations: SavedLocation[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: (loc: { name: string; displayName: string; lat: number; lon: number }) => void;
  onRemove: (id: string) => void;
  onSetHome: (id: string) => void;
  onClose: () => void;
  onUseGPS: () => void;
  gpsLoading: boolean;
}

interface LocationPreview {
  location: SavedLocation;
  weather: WeatherData | null;
  loading: boolean;
}

export default function SavedLocations({
  locations,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  onSetHome,
  onClose,
  onUseGPS,
  gpsLoading,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ name: string; displayName: string; lat: number; lon: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [previews, setPreviews] = useState<LocationPreview[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadPreviews = async () => {
      const loaded: LocationPreview[] = await Promise.all(
        locations.map(async (loc) => {
          try {
            const w = await fetchWeather(loc);
            return { location: loc, weather: w, loading: false };
          } catch {
            return { location: loc, weather: null, loading: false };
          }
        })
      );
      if (!cancelled) setPreviews(loaded);
    };
    loadPreviews();
    return () => {
      cancelled = true;
    };
  }, [locations]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchLocations(query);
      setResults(found);
      setSearching(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleAdd = (loc: { name: string; displayName: string; lat: number; lon: number }) => {
    onAdd(loc);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 animate-fade-in flex flex-col">
      <div className="glass-card rounded-t-3xl w-full max-w-md mx-auto h-full flex flex-col animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-lg font-bold text-white">Ubicaciones</h2>
          <button onClick={onClose} className="glass-card rounded-full p-2 text-white/70 hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Location cards */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-3 pb-2">
          {previews.map((preview, i) => {
            const loc = preview.location;
            const w = preview.weather;
            const isActive = i === activeIndex;
            const condition = w?.current.condition || 'cloudy';
            const isDay = w?.current.isDay ?? true;

            return (
              <div
                key={loc.id}
                onClick={() => {
                  onSelect(i);
                  onClose();
                }}
                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
                  isActive ? 'ring-2 ring-white/40' : ''
                }`}
                style={{ height: '120px' }}
              >
                {/* Dynamic background per location */}
                <div className="absolute inset-0">
                  <DynamicBackground condition={condition} isDay={isDay} />
                </div>

                <div className="relative p-4 flex items-center justify-between h-full">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {loc.isMyLocation && (
                        <Navigation size={12} className="text-white/70" strokeWidth={2} />
                      )}
                      {loc.isHome && (
                        <House size={12} className="text-white/70" strokeWidth={2} />
                      )}
                      <span className="text-xs text-white/60 font-medium">
                        {loc.isMyLocation ? 'Mi Ubicacion' : loc.isHome ? 'Casa' : ''}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white text-shadow-sm">{loc.name}</h3>
                    <p className="text-xs text-white/60">
                      {new Date().toLocaleTimeString('es-PA', { timeZone: 'America/Panama', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {w && (
                      <p className="text-xs text-white/70 mt-0.5">{w.current.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {w ? (
                      <>
                        <div className="flex items-center gap-2">
                          <WeatherIcon condition={condition} size={28} className="text-white/90" />
                          <span className="text-4xl font-extralight text-white text-shadow-sm">
                            {w.current.temp}°
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <span>M: {w.current.tempMax}°</span>
                          <span>m: {w.current.tempMin}°</span>
                        </div>
                      </>
                    ) : (
                      <Loader2 size={24} className="animate-spin text-white/50" />
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!loc.isMyLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetHome(loc.id);
                      }}
                      className={`glass-card rounded-full p-1.5 transition-colors ${
                        loc.isHome ? 'text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                      aria-label="Marcar como casa"
                    >
                      <House size={14} strokeWidth={1.5} />
                    </button>
                  )}
                  {!loc.isMyLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(loc.id);
                      }}
                      className="glass-card rounded-full p-1.5 text-white/40 hover:text-red-400 transition-colors"
                      aria-label="Eliminar ubicacion"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {previews.length === 0 && (
            <div className="text-center py-8 text-white/50 text-sm">
              No hay ubicaciones guardadas
            </div>
          )}
        </div>

        {/* Search bar at bottom */}
        <div className="p-4 pt-2 border-t border-white/10">
          <div className="glass-input flex items-center gap-2 rounded-full px-4 py-2.5">
            <Search size={18} className="text-white/60 shrink-0" strokeWidth={1.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ciudad o distrito..."
              className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none min-w-0"
            />
            {searching && <Loader2 size={16} className="animate-spin text-white/50 shrink-0" />}
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

          {results.length > 0 && (
            <div className="mt-2 glass-card rounded-2xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar animate-fade-in">
              {results.map((loc, i) => (
                <button
                  key={`${loc.name}-${i}`}
                  onClick={() => handleAdd(loc)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                >
                  <MapPin size={16} className="text-white/40 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{loc.name}</p>
                    <p className="text-white/40 text-xs truncate">{loc.displayName}</p>
                  </div>
                  <Plus size={16} className="text-white/40 shrink-0 ml-auto" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onUseGPS}
            disabled={gpsLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 glass-card rounded-full py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            {gpsLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Navigation size={16} strokeWidth={1.5} />
            )}
            Usar mi ubicacion
          </button>
        </div>
      </div>
    </div>
  );
}
