import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
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
  isDay?: boolean;
}

export default function WeatherIcon({ condition, size = 24, className = '', isDay = true }: Props) {
  const iconMap: Record<string, typeof Sun> = {
    clear: isDay ? Sun : Moon,
    'partly-cloudy': isDay ? CloudSun : CloudMoon,
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
