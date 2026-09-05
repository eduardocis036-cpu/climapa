export interface GeoLocation {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
}

export interface SavedLocation extends GeoLocation {
  id: string;
  isHome: boolean;
  isMyLocation: boolean;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  description: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windDirectionLabel: string;
  uvIndex: number;
  uvLabel: string;
  precipitation24h: number;
  dewPoint: number;
  isDay: boolean;
}

export interface ForecastTurn {
  label: string;
  condition: string;
  temp: number;
  rainProb: number;
  time: string;
}

export interface HourlyForecast {
  hour: string;
  temp: number;
  condition: string;
  rainProb: number;
}

export interface DailyForecast {
  dayName: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
}

export interface WeatherData {
  current: CurrentWeather;
  turns: ForecastTurn[];
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

export interface WeatherAlert {
  title: string;
  severity: 'moderate' | 'severe' | 'extreme';
  summary: string;
  details: string;
}
