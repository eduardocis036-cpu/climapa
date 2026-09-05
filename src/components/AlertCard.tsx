import { useState } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import type { WeatherAlert } from '@/types';

interface Props {
  alert: WeatherAlert;
}

export default function AlertCard({ alert }: Props) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    alert.severity === 'severe' ? 'border-orange-400/60' : 'border-yellow-400/60';

  return (
    <div className={`glass-card-alert rounded-3xl p-4 border ${borderColor} animate-fade-in-up stagger-5`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <AlertTriangle size={22} className="text-orange-300" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white uppercase tracking-wide">
            Aviso de Vigilancia IMHPA
          </p>
          <p className="text-sm font-bold text-white mt-0.5 leading-snug">
            {alert.title.replace('Aviso de Vigilancia IMHPA - ', '')}
          </p>
          <p className="text-xs text-white/90 mt-1.5 leading-relaxed">{alert.summary}</p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs font-bold text-white hover:text-orange-200 transition-colors"
          >
            {expanded ? 'Ocultar aviso' : 'Ver aviso completo'}
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {expanded && (
            <div className="mt-2 pt-2 border-t border-white/20 animate-slide-down">
              <p className="text-xs text-white/90 leading-relaxed">{alert.details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
