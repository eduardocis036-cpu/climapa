import { MapPin } from 'lucide-react';
import type { CurrentWeather } from '@/types';

interface Props {
  locationName: string;
  current: CurrentWeather;
}

export default function Header({ locationName, current }: Props) {
  return (
    <div className="flex flex-col items-center text-center px-4 pt-6 pb-4">
      <div className="flex items-center gap-1.5 animate-fade-in-up stagger-1">
        <MapPin size={16} className="text-white/70" strokeWidth={1.5} />
        <h1 className="text-2xl font-semibold text-white text-shadow-sm">{locationName}</h1>
      </div>

      <div className="mt-1 animate-fade-in-up stagger-2">
        <p className="text-7xl sm:text-8xl font-extralight text-white text-shadow-lg tracking-tight">
          {current.temp}
          <span className="text-5xl align-top">°</span>
        </p>
      </div>

      <p className="mt-1 text-base text-white/80 font-medium animate-fade-in-up stagger-3 max-w-xs">
        {current.description}
      </p>

      <div className="mt-2 flex items-center gap-4 text-sm text-white/70 animate-fade-in-up stagger-4">
        <span>
          Máx: <span className="font-semibold text-white/90">{current.tempMax}°</span>
        </span>
        <span className="w-px h-3 bg-white/20" />
        <span>
          Mín: <span className="font-semibold text-white/90">{current.tempMin}°</span>
        </span>
      </div>
    </div>
  );
}
