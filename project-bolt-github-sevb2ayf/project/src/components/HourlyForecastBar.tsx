import type { HourlyForecast } from '@/types';
import WeatherIcon from './WeatherIcon';

interface Props {
  hourly: HourlyForecast[];
}

export default function HourlyForecastBar({ hourly }: Props) {
  const now = new Date();
  const panamaHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'America/Panama', hour: '2-digit', hour12: false }),
    10
  );

  const todayHours = hourly.filter((h) => {
    const hHour = parseInt(h.hour.split(':')[0], 10);
    return hHour >= panamaHour;
  });

  const displayHours = todayHours.slice(0, 12);

  if (displayHours.length === 0) return null;

  return (
    <div
      className="mt-3 pt-3 border-t border-white/10"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 px-1">
        Variacion por horas
      </h3>
      <div
        className="flex gap-1 overflow-x-auto no-scrollbar pb-1"
        style={{ touchAction: 'pan-x' }}
      >
        {displayHours.map((h, i) => {
          const hHour = parseInt(h.hour.split(':')[0], 10);
          const isNow = i === 0;
          const label = isNow ? 'Ahora' : `${hHour}:00`;
          return (
            <div
              key={`${h.hour}-${i}`}
              className={`flex flex-col items-center gap-1 min-w-[48px] py-1.5 px-0.5 rounded-xl ${
                isNow ? 'bg-white/10' : ''
              }`}
            >
              <span className="text-[10px] text-white/50 font-medium">{label}</span>
              <WeatherIcon condition={h.condition} size={20} className="text-white/80" />
              <span className="text-xs text-blue-300/70 font-medium">{h.rainProb}%</span>
              <span className="text-xs font-semibold text-white">{h.temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
