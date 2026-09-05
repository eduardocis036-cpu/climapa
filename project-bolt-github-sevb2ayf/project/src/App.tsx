import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useWeather } from '@/context/WeatherContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import DynamicBackground from '@/components/DynamicBackground';
import Header from '@/components/Header';
import AlertCard from '@/components/AlertCard';
import ForecastStrip from '@/components/ForecastStrip';
import RadarMap from '@/components/RadarMap';
import MetricsGrid from '@/components/MetricsGrid';
import BottomBar from '@/components/BottomBar';
import SavedLocations from '@/components/SavedLocations';
import SearchPreviewModal from '@/components/SearchPreviewModal';

export default function App() {
  const {
    locations,
    activeIndex,
    currentLocation,
    weather,
    alert,
    loading,
    refreshing,
    error,
    gpsLoading,
    currentTurn,
    showSaved,
    showSearch,
    setActiveIndex,
    setShowSaved,
    setShowSearch,
    refresh,
    handleUseGPS,
    handleAddLocation,
    handleRemoveLocation,
    handleSetHome,
    handleSelectFromList,
  } = useWeather();

  const [radarFullscreen, setRadarFullscreen] = useState(false);

  const swipe = useSwipeNavigation({
    onSwipeLeft: () => {
      if (activeIndex < locations.length - 1) setActiveIndex(activeIndex + 1);
    },
    onSwipeRight: () => {
      if (activeIndex > 0) setActiveIndex(activeIndex - 1);
    },
  });

  const pullToRefresh = usePullToRefresh({
    onRefresh: refresh,
    enabled: !showSaved && !showSearch,
  });

  const isDay = weather ? weather.current.isDay : true;
  const condition = weather?.current.condition || 'cloudy';

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      onTouchStart={(e) => {
        swipe.onTouchStart(e);
        pullToRefresh.onTouchStart(e);
      }}
      onTouchMove={pullToRefresh.onTouchMove}
      onTouchEnd={(e) => {
        swipe.onTouchEnd(e);
        pullToRefresh.onTouchEnd(e);
      }}
    >
      <DynamicBackground condition={condition} isDay={isDay} />

      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 animate-fade-in">
          <div className="glass-card rounded-full px-4 py-2 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-white" />
            <span className="text-xs text-white/80 font-medium">Actualizando...</span>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Main content - clean, no search bar */}
        <div className="flex-1 flex flex-col gap-3 px-4 pt-6 pb-24 overflow-y-auto no-scrollbar">
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
                onClick={() => currentLocation && refresh()}
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

              <ForecastStrip
                turns={weather.turns}
                hourly={weather.hourly}
                currentTurn={currentTurn}
              />

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
        locations={locations}
        activeIndex={activeIndex}
        onAdd={() => setShowSearch(true)}
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

      {/* Search + preview modal (iOS-style) */}
      {showSearch && (
        <SearchPreviewModal
          onClose={() => setShowSearch(false)}
          onAdd={handleAddLocation}
          onUseGPS={handleUseGPS}
          gpsLoading={gpsLoading}
        />
      )}
    </div>
  );
}
