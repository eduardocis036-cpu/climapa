import { Plus, List, Navigation, House } from 'lucide-react';

interface Props {
  total: number;
  activeIndex: number;
  onAdd: () => void;
  onList: () => void;
  onGPS: () => void;
  gpsLoading: boolean;
}

export default function BottomBar({ total, activeIndex, onAdd, onList, onGPS, gpsLoading }: Props) {
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

        {/* Page dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-2 h-2 bg-white'
                  : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* GPS button */}
        <button
          onClick={onGPS}
          disabled={gpsLoading}
          className="text-white/70 hover:text-white active:scale-90 transition-all disabled:opacity-50"
          aria-label="Ubicacion actual"
        >
          {gpsLoading ? (
            <Navigation size={20} className="animate-pulse" strokeWidth={1.5} />
          ) : (
            <Navigation size={20} strokeWidth={1.5} />
          )}
        </button>

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
