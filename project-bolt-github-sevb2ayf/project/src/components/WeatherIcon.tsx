import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  CloudFog,
  CloudSnow,
  CloudDrizzle,
} from 'lucide-react';

interface Props {
  condition: string;
  size?: number;
  className?: string;
}

export default function WeatherIcon({ condition, size = 24, className = '' }: Props) {
  const iconMap: Record<string, typeof Sun> = {
    clear: Sun,
    'partly-cloudy': CloudSun,
    cloudy: Cloud,
    rain: CloudRain,
    thunderstorm: CloudLightning,
    fog: CloudFog,
    snow: CloudSnow,
    drizzle: CloudDrizzle,
  };

  const Icon = iconMap[condition] || Sun;

  return <Icon size={size} className={className} strokeWidth={1.5} />;
}
