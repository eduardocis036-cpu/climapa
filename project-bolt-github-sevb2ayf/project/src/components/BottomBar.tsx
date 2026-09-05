import { Plus, List, Navigation } from 'lucide-react';
import type { SavedLocation } from '@/types';

interface Props {
  locations: SavedLocation[];
  activeIndex: number;
  onAdd: () => void;
  onList: () => void;
  onGPS: () => void;
  gpsLoading: boolean;
}

export default function BottomBar({
  locations,
  activeIndex,
  onAdd,
  onList,
  onGPS,
  gpsLoading,
}: Props) {
  const activeLocation = locations[activeIndex];
  const isGPSActive = activeLocation?.isMyLocation ?? false;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 pointer-events-none">
      <div className="glass-card rounded-full px-4 py-2.5 flex items-center gap-3 pointer-events-auto shadow-2xl">
        {/* Add button */}
        <button
          onClick={onAdd}
          className="text-white/70 hover:text-white active:scale-90 transition-all"
          aria-label="Anadir ubicacion"
        >
          <Plus size={22} strokeWidth={1.5} />
        </button>

        {/* Navigation indicators */}
        <div className="flex items-center gap-1.5">
          {locations.map((loc, i) => {
            if (loc.isMyLocation) {
              // GPS location: bright arrow acts as indicator, no dot
              return (
                <button
                  key={loc.id}
                  onClick={onGPS}
                  disabled={gpsLoading}
                  className="active:scale-90 transition-all disabled:opacity-50"
                  aria-label="Ubicacion GPS"
                >
                  <Navigation
                    size={18}
                    strokeWidth={2}
                    className={`transition-all duration-300 ${
                      i === activeIndex
                        ? 'text-white scale-110'
                        : 'text-white/40'
                    }`}
                  />
                </button>
              );
            }

            // Saved location: dot indicator
            return (
              <div
                key={loc.id}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-2.5 h-2.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                    : 'w-1.5 h-1.5 bg-white/30'
                }`}
              />
            );
          })}

          {locations.length === 0 && (
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
          )}
        </div>

        {/* GPS button (only if no GPS location in list) */}
        {!locations.some((l) => l.isMyLocation) && (
          <button
            onClick={onGPS}
            disabled={gpsLoading}
            className="text-white/70 hover:text-white active:scale-90 transition-all disabled:opacity-50"
            aria-label="Ubicacion actual"
          >
            <Navigation
              size={20}
              strokeWidth={1.5}
              className={gpsLoading ? 'animate-pulse' : ''}
            />
          </button>
        )}

        {/* List button */}
        <button
          onClick={onList}
          className="text-white/70 hover:text-white active:scale-90 transition-all"
          aria-label="Lista de ubicaciones"
        >
          <List size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
