import WeatherIcon from './WeatherIcon';
import HourlyForecastBar from './HourlyForecastBar';
import type { ForecastTurn, HourlyForecast } from '@/types';

interface Props {
  turns: ForecastTurn[];
  hourly: HourlyForecast[];
  currentTurn: string;
}

export default function ForecastStrip({ turns, hourly, currentTurn }: Props) {
  return (
    <div className="glass-card rounded-3xl p-4 animate-fade-in-up stagger-6">
      <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3 px-1">
        Pronostico por turnos
      </h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {turns.map((turn, i) => {
          const isCurrent = turn.label === currentTurn;
          return (
            <div
              key={`${turn.label}-${i}`}
              className={`flex flex-col items-center gap-2 min-w-[68px] py-2 px-1 rounded-2xl transition-colors ${
                isCurrent ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                {turn.label}
              </span>
              {isCurrent && (
                <span className="w-1 h-1 rounded-full bg-blue-400 -mt-1" />
              )}
              <WeatherIcon condition={turn.condition} size={28} className="text-white/90" />
              <span className="text-xs text-blue-300/80 font-medium">{turn.rainProb}%</span>
              <span className="text-base font-semibold text-white">{turn.temp}°</span>
            </div>
          );
        })}
      </div>

      {hourly.length > 0 && <HourlyForecastBar hourly={hourly} />}
    </div>
  );
}
