import { X } from 'lucide-react';
import type { CurrentWeather } from '@/types';

export type MetricType = 'uv' | 'wind' | 'humidity' | 'precipitation';

interface Props {
  type: MetricType;
  current: CurrentWeather;
  onClose: () => void;
}

interface MetricDetail {
  title: string;
  value: string;
  description: string;
  range: string;
  tips: string[];
}

function getMetricDetail(type: MetricType, current: CurrentWeather): MetricDetail {
  switch (type) {
    case 'uv': {
      const tips =
        current.uvIndex <= 2
          ? ['Puedes salir al aire libre sin proteccion especial', 'Usa lentes de sol si hay reflejo del agua']
          : current.uvIndex <= 5
          ? ['Usa protector solar SPF 30+', 'Usa sombrero y lentes de sol', 'Evita exposicion prolongada entre 11am y 2pm']
          : current.uvIndex <= 7
          ? ['Protector solar SPF 50+ obligatorio', 'Busca sombra entre 11am y 3pm', 'Usa ropa que cubra brazos y piernas']
          : ['Evita exponerte al sol entre 10am y 4pm', 'Protector solar SPF 50+, reaplica cada 2 horas', 'Usa sombrero de ala ancha y ropa UV'];
      return {
        title: 'Indice UV',
        value: `${current.uvIndex} - ${current.uvLabel}`,
        description:
          'El indice UV mide la intensidad de la radiacion ultravioleta solar que llega a la superficie. En Panama, debido a nuestra proximity al ecuador, los valores pueden ser muy altos durante la epoca seca.',
        range: 'Escala: 0-2 Bajo (verde) | 3-5 Moderado (amarillo) | 6-7 Alto (naranja) | 8-10 Muy alto (rojo) | 11+ Extremo (violeta)',
        tips,
      };
    }
    case 'wind': {
      const beaufort =
        current.windSpeed < 6
          ? 'Calma'
          : current.windSpeed < 20
          ? 'Brisa ligera'
          : current.windSpeed < 40
          ? 'Brisa moderada'
          : current.windSpeed < 62
          ? 'Viento fuerte'
          : 'Viento muy fuerte';
      return {
        title: 'Viento',
        value: `${current.windSpeed} km/h - ${beaufort}`,
        description:
          'La velocidad del viento indica la fuerza con que el aire se desplaza. La direccion nos dice de donde proviene. En Panama, los vientos alisios dominan del noreste durante la epoca seca.',
        range: `Direccion actual: ${current.windDirectionLabel} (${current.windDirection}°). Escala Beaufort: 0-5 km/h Calma | 6-20 Brisa | 21-40 Moderado | 41-62 Fuerte | 62+ Tempestad`,
        tips: [
          'Vientos sobre 40 km/h pueden generar oleaje peligroso',
          'En tormentas, las rafagas pueden superar los 60 km/h',
          'Los vientos del norte traen humedad del Mar Caribe',
        ],
      };
    }
    case 'humidity': {
      const level = current.dewPoint >= 23 ? 'muy alto' : current.dewPoint >= 18 ? 'alto' : 'normal';
      return {
        title: 'Humedad',
        value: `${current.humidity}% - Punto de rocio ${current.dewPoint}°`,
        description:
          `La humedad relativa indica la cantidad de vapor de agua en el aire. Con un punto de rocio ${level} (${current.dewPoint}°), la sensacion de calor aumenta significativamente. En Panama, la humedad suele superar el 80% durante la epoca de lluvias.`,
        range: 'Punto de rocio: <15° Confortable | 16-20° Agradable | 21-24° Opresivo | 25+° Extremadamente incomodo',
        tips: [
          'Humedad sobre 85% aumenta la sensacion termica varios grados',
          'Mantente hidratado, el cuerpo suda mas en alta humedad',
          'Punto de rocio sobre 23° indica aire muy pesado y bochornoso',
        ],
      };
    }
    case 'precipitation': {
      const level =
        current.precipitation24h > 25
          ? 'torrencial'
          : current.precipitation24h > 10
          ? 'moderada a fuerte'
          : current.precipitation24h > 2
          ? 'ligera'
          : 'sin precipitacion';
      return {
        title: 'Precipitacion',
        value: `${current.precipitation24h} mm - ${level}`,
        description:
          'La precipitacion mide la cantidad de agua que cae en un periodo. En Panama, la epoca de lluvias (mayo a diciembre) puede registrar acumulados superiores a 30mm diarios en zonas como Bocas del Toro y Darien.',
        range: 'Escala: 0-2mm Sin lluvia | 2-10mm Lluvia ligera | 10-25mm Moderada | 25-50mm Fuerte | 50mm+ Torrencial',
        tips: [
          'Mas de 25mm en 24h puede causar inundaciones repentinas',
          'Evita cruzar quebradas y rios crecidos',
          'En zonas montañosas (Chiriqui, Cocle), el riesgo de deslaves aumenta',
        ],
      };
    }
  }
}

export default function MetricDetailModal({ type, current, onClose }: Props) {
  const detail = getMetricDetail(type, current);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto no-scrollbar p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{detail.title}</h2>
          <button
            onClick={onClose}
            className="glass-card rounded-full p-2 text-white/70 hover:text-white"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-3xl font-light text-white">{detail.value}</p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
              Que significa
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">{detail.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
              Rango de riesgo
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">{detail.range}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
              Consejos para Panama
            </h3>
            <ul className="space-y-2">
              {detail.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
