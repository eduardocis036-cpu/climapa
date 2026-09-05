import { useMemo } from 'react';

interface Props {
  condition: string;
  isDay: boolean;
}

export default function DynamicBackground({ condition, isDay }: Props) {
  const gradient = useMemo(() => {
    if (!isDay) {
      return 'linear-gradient(180deg, #0a0e1a 0%, #141c2e 40%, #1a2336 100%)';
    }
    switch (condition) {
      case 'clear':
        return 'linear-gradient(180deg, #1a4a7a 0%, #2a6ba8 30%, #4a8bc2 100%)';
      case 'partly-cloudy':
        return 'linear-gradient(180deg, #2a4a6a 0%, #3a5a7a 40%, #5a7a9a 100%)';
      case 'cloudy':
        return 'linear-gradient(180deg, #2a3344 0%, #3a4458 40%, #4a5568 100%)';
      case 'rain':
      case 'drizzle':
        return 'linear-gradient(180deg, #1a2438 0%, #2a3a52 40%, #3a4a68 100%)';
      case 'thunderstorm':
        return 'linear-gradient(180deg, #0e1525 0%, #1a2238 40%, #2a2e48 100%)';
      case 'fog':
        return 'linear-gradient(180deg, #2a3340 0%, #3a4450 40%, #4a5560 100%)';
      case 'snow':
        return 'linear-gradient(180deg, #2a3a4a 0%, #3a4a5a 40%, #5a6a7a 100%)';
      default:
        return 'linear-gradient(180deg, #1a2438 0%, #2a3a52 40%, #3a4a68 100%)';
    }
  }, [condition, isDay]);

  const showRain = condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm';
  const showThunder = condition === 'thunderstorm';

  const rainDrops = useMemo(() => {
    if (!showRain) return [];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 0.8 + Math.random() * 0.6,
      opacity: 0.15 + Math.random() * 0.25,
    }));
  }, [showRain]);

  const cloudOverlay =
    'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.08) 0%, transparent 50%), ' +
    'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.06) 0%, transparent 50%), ' +
    'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)';

  const vignette =
    'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)';

  return (
    <div className="fixed inset-0 overflow-hidden -z-10" style={{ background: gradient }}>
      <div className="absolute inset-0 opacity-40" style={{ background: cloudOverlay }} />

      {showRain && (
        <div className="absolute inset-0">
          {rainDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute w-0.5 h-8 bg-gradient-to-b from-transparent via-blue-200/30 to-transparent"
              style={{
                left: `${drop.left}%`,
                top: '-20px',
                animation: `rain-fall ${drop.duration}s linear ${drop.delay}s infinite`,
                opacity: drop.opacity,
              }}
            />
          ))}
        </div>
      )}

      {showThunder && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.04) 0%, transparent 40%)',
            animation: 'thunder-soft 8s ease-in-out infinite',
          }}
        />
      )}

      <div className="absolute inset-0" style={{ background: vignette }} />
    </div>
  );
}
