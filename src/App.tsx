import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { GeoLocation, SavedLocation, WeatherData, WeatherAlert } from '@/types';
import { getCurrentPosition, reverseGeocode } from '@/lib/geocode';
import { fetchWeather, generateAlert, getCurrentTurnLabel } from '@/lib/weatherApi';
import {
  loadSavedLocations,
  saveLocations,
  loadActiveIndex,
  saveActiveIndex,
  createSavedLocation,
} from '@/lib/storage';
import DynamicBackground from '@/components/DynamicBackground';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';
import AlertCard from '@/components/AlertCard';
import ForecastStrip from '@/components/ForecastStrip';
import RadarMap from '@/components/RadarMap';
import MetricsGrid from '@/components/MetricsGrid';
import BottomBar from '@/components/BottomBar';
import SavedLocations from '@/components/SavedLocations';

export default function App() {
  const [locations, setLocations] = useState<SavedLocation[]>(loadSavedLocations);
  const [activeIndex, setActiveIndex] = useState(loadActiveIndex);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alert, setAlert] = useState<WeatherAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [radarFullscreen, setRadarFullscreen] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentLocation = locations[activeIndex] || locations[0];

  const loadWeather = useCallback(async (loc: GeoLocation) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const data = await fetchWeather(loc);
      setWeather(data);
      setAlert(generateAlert(data));
    } catch {
      setError('No se pudieron cargar los datos del clima. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadWeather(currentLocation);
    }
  }, [currentLocation, loadWeather]);

  useEffect(() => {
    saveLocations(locations);
  }, [locations]);

  useEffect(() => {
    saveActiveIndex(activeIndex);
  }, [activeIndex]);

  const handleSelectLocation = (loc: GeoLocation) => {
    const newSaved = createSavedLocation(loc);
    const updated = [...locations];
    const existIdx = updated.findIndex(
      (l) => Math.abs(l.lat - loc.lat) < 0.01 && Math.abs(l.lon - loc.lon) < 0.01
    );
    if (existIdx >= 0) {
      setActiveIndex(existIdx);
    } else {
      updated.push(newSaved);
      setLocations(updated);
      setActiveIndex(updated.length - 1);
    }
    setShowSearch(false);
  };

  const handleUseGPS = async () => {
    setGpsLoading(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const loc = await reverseGeocode(latitude, longitude);
      const existIdx = locations.findIndex(
        (l) => Math.abs(l.lat - latitude) < 0.01 && Math.abs(l.lon - longitude) < 0.01
      );
      if (existIdx >= 0) {
        setActiveIndex(existIdx);
      } else {
        const newLoc = createSavedLocation(loc, { isMyLocation: true });
        const updated = locations.map((l) => ({ ...l, isMyLocation: false }));
        updated.push(newLoc);
        setLocations(updated);
        setActiveIndex(updated.length - 1);
      }
    } catch {
      setActiveIndex(0);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleAddLocation = (loc: { name: string; displayName: string; lat: number; lon: number }) => {
    const existIdx = locations.findIndex(
      (l) => Math.abs(l.lat - loc.lat) < 0.01 && Math.abs(l.lon - loc.lon) < 0.01
    );
    if (existIdx >= 0) {
      setActiveIndex(existIdx);
    } else {
      const newLoc = createSavedLocation(loc);
      setLocations([...locations, newLoc]);
      setActiveIndex(locations.length);
    }
  };

  const handleRemoveLocation = (id: string) => {
    const updated = locations.filter((l) => l.id !== id);
    if (updated.length === 0) return;
    setLocations(updated);
    if (activeIndex >= updated.length) {
      setActiveIndex(updated.length - 1);
    }
  };

  const handleSetHome = (id: string) => {
    setLocations(locations.map((l) => ({ ...l, isHome: l.id === id })));
  };

  const handleSelectFromList = (index: number) => {
    setActiveIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 80;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && activeIndex < locations.length - 1) {
        setActiveIndex(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      }
    }
  };

  const isDay = weather ? weather.current.isDay : true;
  const condition = weather?.current.condition || 'cloudy';
  const currentTurn = getCurrentTurnLabel();

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <DynamicBackground condition={condition} isDay={isDay} />

      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Search bar - only shown when toggled */}
        {showSearch && (
          <div className="sticky top-0 z-40 px-4 pt-4 pb-2 animate-fade-in">
            <SearchBar
              currentLocationName={currentLocation?.name || ''}
              onSelectLocation={handleSelectLocation}
              onUseGPS={handleUseGPS}
              gpsLoading={gpsLoading}
            />
          </div>
        )}

        {/* Page indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-1">
          <span className="text-xs text-white/50 font-medium">
            {activeIndex + 1} de {locations.length}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-3 px-4 pb-24 overflow-y-auto no-scrollbar">
          {loading && !weather && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/60">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm">Cargando datos meteorologicos...</p>
            </div>
          )}

          {error && !weather && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <p className="text-white/70 text-sm">{error}</p>
              <button
                onClick={() => currentLocation && loadWeather(currentLocation)}
                className="glass-card rounded-full px-5 py-2 text-sm font-medium text-white hover:bg-white/15 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {weather && currentLocation && (
            <>
              <Header locationName={currentLocation.name} current={weather.current} />

              {alert && <AlertCard alert={alert} />}

              <ForecastStrip turns={weather.turns} hourly={weather.hourly} currentTurn={currentTurn} />

              <RadarMap
                lat={currentLocation.lat}
                lon={currentLocation.lon}
                fullscreen={radarFullscreen}
                onToggleFullscreen={() => setRadarFullscreen(!radarFullscreen)}
              />

              <MetricsGrid current={weather.current} />

              <div className="mt-4 mb-2 text-center px-4">
                <p className="text-[10px] text-white/35 leading-relaxed">
                  Datos meteorologicos obtenidos de los reportes oficiales del{' '}
                  <a
                    href="https://www.imhpa.gob.pa/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 underline hover:text-white/80 transition-colors"
                  >
                    Instituto de Meteorologia e Hidrologia de Panama (IMHPA)
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom floating bar */}
      <BottomBar
        total={locations.length}
        activeIndex={activeIndex}
        onAdd={() => setShowSearch(!showSearch)}
        onList={() => setShowSaved(true)}
        onGPS={handleUseGPS}
        gpsLoading={gpsLoading}
      />

      {/* Saved locations modal */}
      {showSaved && (
        <SavedLocations
          locations={locations}
          activeIndex={activeIndex}
          onSelect={handleSelectFromList}
          onAdd={handleAddLocation}
          onRemove={handleRemoveLocation}
          onSetHome={handleSetHome}
          onClose={() => setShowSaved(false)}
          onUseGPS={handleUseGPS}
          gpsLoading={gpsLoading}
        />
      )}
    </div>
  );
}
