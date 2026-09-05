import { useState } from 'react';
import { Sun, Wind, Droplets, CloudRain } from 'lucide-react';
import type { CurrentWeather } from '@/types';
import type { MetricType } from './MetricDetailModal';
import MetricDetailModal from './MetricDetailModal';

interface Props {
  current: CurrentWeather;
}

export default function MetricsGrid({ current }: Props) {
  const [activeModal, setActiveModal] = useState<MetricType | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-8">
        {/* UV Index */}
        <button
          onClick={() => setActiveModal('uv')}
          className="glass-card rounded-3xl p-4 text-left active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Sun size={14} className="text-white/50" strokeWidth={1.5} />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Indice UV</span>
          </div>
          <p className="text-3xl font-light text-white">
            {current.uvIndex}
            <span className="text-sm font-medium text-white/60 ml-1.5">{current.uvLabel}</span>
          </p>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{
            background: 'linear-gradient(90deg, #4eb800 0%, #f8e400 30%, #f86000 60%, #d80010 80%, #6b49c8 100%)'
          }}>
            <div
              className="h-full w-1 bg-white rounded-full shadow-md"
              style={{ marginLeft: `${Math.min(current.uvIndex * 8, 96)}%` }}
            />
          </div>
        </button>

        {/* Wind */}
        <button
          onClick={() => setActiveModal('wind')}
          className="glass-card rounded-3xl p-4 text-left active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Wind size={14} className="text-white/50" strokeWidth={1.5} />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Viento</span>
          </div>
          <p className="text-3xl font-light text-white">
            {current.windSpeed}
            <span className="text-sm font-medium text-white/60 ml-1">km/h</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
              <div
                className="absolute w-0.5 h-4 bg-white/80 rounded-full"
                style={{ transform: `rotate(${current.windDirection}deg)`, transformOrigin: 'center bottom', bottom: '50%' }}
              />
              <span className="text-[9px] font-bold text-white/40 absolute top-0.5">N</span>
              <span className="text-[9px] font-bold text-white/40 absolute bottom-0.5">S</span>
            </div>
            <span className="text-sm font-medium text-white/70">{current.windDirectionLabel}</span>
          </div>
        </button>

        {/* Humidity */}
        <button
          onClick={() => setActiveModal('humidity')}
          className="glass-card rounded-3xl p-4 text-left active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Droplets size={14} className="text-white/50" strokeWidth={1.5} />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Humedad</span>
          </div>
          <p className="text-3xl font-light text-white">
            {current.humidity}
            <span className="text-sm font-medium text-white/60 ml-0.5">%</span>
          </p>
          <p className="mt-3 text-xs text-white/50">
            {current.dewPoint >= 22 ? 'Punto de rocio elevado' : 'Punto de rocio normal'}
            <span className="text-white/40"> - {current.dewPoint}°</span>
          </p>
        </button>

        {/* Precipitation */}
        <button
          onClick={() => setActiveModal('precipitation')}
          className="glass-card rounded-3xl p-4 text-left active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <CloudRain size={14} className="text-white/50" strokeWidth={1.5} />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Precipitacion</span>
          </div>
          <p className="text-3xl font-light text-white">
            {current.precipitation24h}
            <span className="text-sm font-medium text-white/60 ml-1">mm</span>
          </p>
          <p className="mt-3 text-xs text-white/50">
            {current.precipitation24h > 10
              ? 'Acumulado significativo en 24h'
              : current.precipitation24h > 0
              ? 'Lluvia ligera en 24h'
              : 'Sin precipitacion'}
          </p>
        </button>
      </div>

      {activeModal && (
        <MetricDetailModal
          type={activeModal}
          current={current}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
