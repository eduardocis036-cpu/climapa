import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Loader2, Navigation, Plus, ArrowLeft } from 'lucide-react';
import type { GeoLocation, WeatherData } from '@/types';
import { searchLocations } from '@/lib/geocode';
import { fetchWeather } from '@/lib/weatherApi';
import { PANAMA_LOCATIONS } from '@/config/panamaLocations';
import WeatherIcon from './WeatherIcon';
import DynamicBackground from './DynamicBackground';

interface Props {
  onClose: () => void;
  onAdd: (loc: GeoLocation) => void;
  onUseGPS: () => void;
  gpsLoading: boolean;
}

type ViewState = 'search' | 'preview';

export default function SearchPreviewModal({ onClose, onAdd, onUseGPS, gpsLoading }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewState>('search');
  const [selectedLoc, setSelectedLoc] = useState<GeoLocation | null>(null);
  const [previewWeather, setPreviewWeather] = useState<WeatherData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filteredLocal =
    query.trim().length > 0
      ? PANAMA_LOCATIONS.filter(
          (l) =>
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

  const handleSelectResult = async (loc: GeoLocation) => {
    setSelectedLoc(loc);
    setView('preview');
    setPreviewLoading(true);
    setPreviewWeather(null);
    try {
      const w = await fetchWeather(loc);
      setPreviewWeather(w);
    } catch {
      setPreviewWeather(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (selectedLoc) {
      onAdd(selectedLoc);
      onClose();
    }
  };

  const handleBackToSearch = () => {
    setView('search');
    setSelectedLoc(null);
    setPreviewWeather(null);
  };

  const condition = previewWeather?.current.condition || 'cloudy';
  const isDay = previewWeather?.current.isDay ?? true;

  // Search view
  if (view === 'search') {
    return (
      <div className="fixed inset-0 z-[95] bg-black/60 animate-fade-in flex flex-col">
        <div className="glass-card rounded-t-3xl w-full max-w-md mx-auto h-full flex flex-col animate-fade-in-up overflow-hidden">
          {/* Sticky header */}
          <div className="flex items-center gap-3 p-4 pb-3 border-b border-white/10">
            <button
              onClick={onClose}
              className="glass-card rounded-full p-2 text-white/70 hover:text-white transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <div className="glass-input flex-1 flex items-center gap-2 rounded-full px-4 py-2.5">
              <Search size={18} className="text-white/60 shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                placeholder="Buscar ciudad o distrito..."
                className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none min-w-0"
              />
              {loading && (
                <Loader2 size={16} className="animate-spin text-white/50 shrink-0" />
              )}
              {query && !loading && (
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
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
            {query.trim().length < 2 && (
              <div className="text-center py-12 text-white/40 text-sm">
                Escribe el nombre de una ciudad o distrito para buscar
              </div>
            )}

            {query.trim().length >= 2 && !loading && combinedResults.length === 0 && (
              <div className="text-center py-12 text-white/40 text-sm">
                No se encontraron ubicaciones
              </div>
            )}

            {combinedResults.map((loc, i) => (
              <button
                key={`${loc.name}-${i}`}
                onClick={() => handleSelectResult(loc)}
                className="w-full flex items-center gap-3 px-3 py-3.5 text-left hover:bg-white/10 active:bg-white/15 transition-colors rounded-2xl mb-1"
              >
                <MapPin size={16} className="text-white/40 shrink-0" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{loc.name}</p>
                  <p className="text-white/40 text-xs truncate">{loc.displayName}</p>
                </div>
              </button>
            ))}
          </div>

          {/* GPS button */}
          <div className="p-4 pt-3 border-t border-white/10">
            <button
              onClick={onUseGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 glass-card rounded-full py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors disabled:opacity-50"
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

  // Preview view (iOS-style sheet)
  return (
    <div className="fixed inset-0 z-[95] bg-black/60 animate-fade-in flex flex-col">
      <div className="w-full max-w-md mx-auto h-full flex flex-col animate-fade-in-up overflow-hidden relative">
        {/* Dynamic background */}
        <div className="absolute inset-0">
          <DynamicBackground condition={condition} isDay={isDay} />
        </div>

        {/* Sticky header */}
        <div className="relative flex items-center justify-between p-4 pt-6">
          <button
            onClick={handleBackToSearch}
            className="glass-card rounded-full p-2.5 text-white/80 hover:text-white active:scale-90 transition-all"
            aria-label="Volver"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>

          <div className="glass-card rounded-full px-4 py-1.5">
            <p className="text-xs font-medium text-white/90 truncate max-w-[160px]">
              {selectedLoc?.name}
            </p>
          </div>

          <button
            onClick={handleConfirmAdd}
            disabled={previewLoading}
            className="glass-card rounded-full p-2.5 text-white hover:text-white active:scale-90 transition-all disabled:opacity-50"
            aria-label="Anadir ubicacion"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            <Plus size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Preview content */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6">
          {previewLoading && (
            <div className="flex flex-col items-center gap-3 text-white/70">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm">Cargando vista previa...</p>
            </div>
          )}

          {!previewLoading && !previewWeather && (
            <div className="flex flex-col items-center gap-3 text-white/70 text-center">
              <p className="text-sm">No se pudieron cargar los datos del clima.</p>
              <button
                onClick={() => selectedLoc && handleSelectResult(selectedLoc)}
                className="glass-card rounded-full px-5 py-2 text-sm font-medium text-white hover:bg-white/15 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {!previewLoading && previewWeather && selectedLoc && (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={16} className="text-white/70" strokeWidth={1.5} />
                <h2 className="text-xl font-semibold text-white text-shadow-sm">
                  {selectedLoc.name}
                </h2>
              </div>
              <p className="text-xs text-white/50 mb-4 text-center max-w-[240px] truncate">
                {selectedLoc.displayName}
              </p>

              <div className="mb-2">
                <p className="text-7xl font-extralight text-white text-shadow-lg tracking-tight">
                  {previewWeather.current.temp}
                  <span className="text-5xl align-top">°</span>
                </p>
              </div>

              <p className="text-base text-white/80 font-medium text-center mb-3">
                {previewWeather.current.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-white/70 mb-6">
                <span>
                  Max:{' '}
                  <span className="font-semibold text-white/90">
                    {previewWeather.current.tempMax}°
                  </span>
                </span>
                <span className="w-px h-3 bg-white/20" />
                <span>
                  Min:{' '}
                  <span className="font-semibold text-white/90">
                    {previewWeather.current.tempMin}°
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                <div className="glass-card rounded-2xl p-3 text-center">
                  <WeatherIcon
                    condition={previewWeather.current.condition}
                    size={22}
                    className="text-white/80 mx-auto mb-1"
                  />
                  <p className="text-lg font-light text-white">
                    {previewWeather.current.humidity}%
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">
                    Humedad
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-3 text-center">
                  <WeatherIcon
                    condition="partly-cloudy"
                    size={22}
                    className="text-white/80 mx-auto mb-1"
                  />
                  <p className="text-lg font-light text-white">
                    {previewWeather.current.windSpeed}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">
                    km/h
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-3 text-center">
                  <WeatherIcon
                    condition="rain"
                    size={22}
                    className="text-white/80 mx-auto mb-1"
                  />
                  <p className="text-lg font-light text-white">
                    {previewWeather.current.precipitation24h}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">mm</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom hint */}
        <div className="relative p-4 pb-8 text-center">
          <p className="text-xs text-white/40">
            Toca <Plus size={11} className="inline -mt-0.5" strokeWidth={2} /> para anadir
            esta ubicacion a tu lista
          </p>
        </div>
      </div>
    </div>
  );
}
