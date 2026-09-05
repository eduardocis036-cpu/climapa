import type {
  CurrentWeather,
  DailyForecast,
  ForecastTurn,
  HourlyForecast,
  WeatherAlert,
  WeatherData,
} from '@/types';
import type { GeoLocation } from '@/types';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    is_day: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
  };
}

const WEATHER_DESCRIPTIONS: Record<number, { desc: string; condition: string }> = {
  0: { desc: 'Despejado', condition: 'clear' },
  1: { desc: 'Mayormente despejado', condition: 'partly-cloudy' },
  2: { desc: 'Parcialmente nublado', condition: 'partly-cloudy' },
  3: { desc: 'Nublado', condition: 'cloudy' },
  45: { desc: 'Niebla', condition: 'fog' },
  48: { desc: 'Niebla con escarcha', condition: 'fog' },
  51: { desc: 'Llovizna ligera', condition: 'drizzle' },
  53: { desc: 'Llovizna moderada', condition: 'drizzle' },
  55: { desc: 'Llovizna densa', condition: 'drizzle' },
  56: { desc: 'Llovizna helada ligera', condition: 'drizzle' },
  57: { desc: 'Llovizna helada densa', condition: 'drizzle' },
  61: { desc: 'Lluvia ligera', condition: 'rain' },
  63: { desc: 'Lluvia moderada', condition: 'rain' },
  65: { desc: 'Lluvia fuerte', condition: 'rain' },
  66: { desc: 'Lluvia helada ligera', condition: 'rain' },
  67: { desc: 'Lluvia helada fuerte', condition: 'rain' },
  71: { desc: 'Nieve ligera', condition: 'snow' },
  73: { desc: 'Nieve moderada', condition: 'snow' },
  75: { desc: 'Nieve fuerte', condition: 'snow' },
  77: { desc: 'Granos de nieve', condition: 'snow' },
  80: { desc: 'Chubascos ligeros', condition: 'rain' },
  81: { desc: 'Chubascos moderados', condition: 'rain' },
  82: { desc: 'Chubascos violentos', condition: 'rain' },
  85: { desc: 'Chubascos de nieve ligeros', condition: 'snow' },
  86: { desc: 'Chubascos de nieve fuertes', condition: 'snow' },
  95: { desc: 'Tormenta electrica', condition: 'thunderstorm' },
  96: { desc: 'Tormenta con granizo ligero', condition: 'thunderstorm' },
  99: { desc: 'Tormenta con granizo fuerte', condition: 'thunderstorm' },
};

function getWeatherInfo(code: number): { desc: string; condition: string } {
  return WEATHER_DESCRIPTIONS[code] || { desc: 'Despejado', condition: 'clear' };
}

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

function uvLabel(uv: number): string {
  if (uv <= 2) return 'Bajo';
  if (uv <= 5) return 'Moderado';
  if (uv <= 7) return 'Alto';
  if (uv <= 10) return 'Muy alto';
  return 'Extremo';
}

function adjustUvForCondition(uv: number, condition: string): number {
  if (condition === 'rain' || condition === 'thunderstorm' || condition === 'drizzle') {
    return Math.min(Math.max(uv, 1), 4);
  }
  if (condition === 'cloudy' || condition === 'fog') {
    return Math.min(Math.max(uv, 2), 5);
  }
  return uv;
}

function getAlertDescription(code: number): string {
  if ([95, 96, 99].includes(code)) {
    return 'Cielo nublado con chubascos aislados y actividad electrica';
  }
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return 'Cielo nublado con chubascos dispersos';
  }
  if ([51, 53, 55].includes(code)) {
    return 'Cielo nublado con llovizna';
  }
  if ([3].includes(code)) {
    return 'Cielo nublado sin precipitacion significativa';
  }
  if ([1, 2].includes(code)) {
    return 'Parcialmente nublado con posibilidad de chubascos';
  }
  if (code === 0) {
    return 'Cielo despejado y soleado';
  }
  return 'Cielo nublado con chubascos aislados y actividad electrica';
}

export async function fetchWeather(location: GeoLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: location.lat.toString(),
    longitude: location.lon.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max',
    hourly: 'temperature_2m,precipitation_probability,weather_code,relative_humidity_2m,dew_point_2m',
    timezone: 'America/Panama',
    forecast_days: '5',
  });

  const url = `${OPEN_METEO_BASE}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error('Failed to fetch weather data');

  const data: OpenMeteoResponse = await res.json();

  const code = data.current.weather_code;
  const info = getWeatherInfo(code);

  const now = new Date();
  const panamaHour = now.toLocaleString('en-US', { timeZone: 'America/Panama', hour: '2-digit', hour12: false });
  const currentHour = parseInt(panamaHour, 10);

  const turns: ForecastTurn[] = [];

  const todayDate = data.daily.time[0];
  const tomorrowDate = data.daily.time[1];

  const todayHours = data.hourly.time
    .map((t, i) => ({ time: t, index: i }))
    .filter((h) => h.time.startsWith(todayDate));

  const tomorrowHours = data.hourly.time
    .map((t, i) => ({ time: t, index: i }))
    .filter((h) => h.time.startsWith(tomorrowDate));

  const turnHours = [
    { label: 'Manana', targetHour: 8, hours: todayHours },
    { label: 'Tarde', targetHour: 14, hours: todayHours },
    { label: 'Noche', targetHour: 20, hours: todayHours },
  ];

  for (const turn of turnHours) {
    const matching = turn.hours.find((h) => {
      const hHour = parseInt(h.time.split('T')[1].split(':')[0], 10);
      return hHour === turn.targetHour;
    });
    if (matching) {
      const hCode = data.hourly.weather_code[matching.index];
      const hInfo = getWeatherInfo(hCode);
      turns.push({
        label: turn.label,
        condition: hInfo.condition,
        temp: Math.round(data.hourly.temperature_2m[matching.index]),
        rainProb: data.hourly.precipitation_probability[matching.index] || 0,
        time: turn.label,
      });
    }
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  for (let d = 1; d <= 3 && d < data.daily.time.length; d++) {
    const date = new Date(data.daily.time[d] + 'T12:00:00');
    const dCode = data.daily.weather_code[d];
    const dInfo = getWeatherInfo(dCode);
    turns.push({
      label: dayNames[date.getDay()],
      condition: dInfo.condition,
      temp: Math.round(data.daily.temperature_2m_max[d]),
      rainProb: data.daily.precipitation_probability_max[d] || 0,
      time: data.daily.time[d],
    });
  }

  const daily: DailyForecast[] = [];
  for (let d = 0; d < Math.min(5, data.daily.time.length); d++) {
    const date = new Date(data.daily.time[d] + 'T12:00:00');
    const dCode = data.daily.weather_code[d];
    const dInfo = getWeatherInfo(dCode);
    daily.push({
      dayName: d === 0 ? 'Hoy' : dayNames[date.getDay()],
      condition: dInfo.condition,
      tempMax: Math.round(data.daily.temperature_2m_max[d]),
      tempMin: Math.round(data.daily.temperature_2m_min[d]),
      rainProb: data.daily.precipitation_probability_max[d] || 0,
    });
  }

  const precip24h = data.daily.precipitation_sum[0] || 0;

  let dewPoint = 0;
  const currentHourlyIdx = data.hourly.time.findIndex((t) => {
    const hHour = parseInt(t.split('T')[1]?.split(':')[0] || '0', 10);
    return hHour === currentHour;
  });
  if (currentHourlyIdx >= 0) {
    dewPoint = data.hourly.dew_point_2m[currentHourlyIdx] || 0;
  }

  const rawUv = Math.round(data.daily.uv_index_max[0] || 0);
  const adjustedUv = adjustUvForCondition(rawUv, info.condition);

  const current: CurrentWeather = {
    temp: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    description: getAlertDescription(code),
    condition: info.condition,
    tempMax: Math.round(data.daily.temperature_2m_max[0]),
    tempMin: Math.round(data.daily.temperature_2m_min[0]),
    humidity: data.current.relative_humidity_2m,
    windSpeed: Math.round(data.current.wind_speed_10m),
    windDirection: data.current.wind_direction_10m,
    windDirectionLabel: windDirectionLabel(data.current.wind_direction_10m),
    uvIndex: adjustedUv,
    uvLabel: uvLabel(adjustedUv),
    precipitation24h: Math.round(precip24h * 10) / 10,
    dewPoint: Math.round(dewPoint),
    isDay: data.current.is_day === 1,
  };

  const hourly: HourlyForecast[] = [];
  const todayHourlyCount = todayHours.length;
  for (let i = 0; i < todayHourlyCount; i++) {
    const hIdx = todayHours[i].index;
    const hCode = data.hourly.weather_code[hIdx];
    const hInfo = getWeatherInfo(hCode);
    const hStr = todayHours[i].time.split('T')[1];
    hourly.push({
      hour: hStr,
      temp: Math.round(data.hourly.temperature_2m[hIdx]),
      condition: hInfo.condition,
      rainProb: data.hourly.precipitation_probability[hIdx] || 0,
    });
  }

  return { current, turns, daily, hourly };
}

export function getCurrentTurnLabel(): string {
  const now = new Date();
  const panamaHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'America/Panama', hour: '2-digit', hour12: false }),
    10
  );
  if (panamaHour >= 6 && panamaHour < 12) return 'Manana';
  if (panamaHour >= 12 && panamaHour < 19) return 'Tarde';
  return 'Noche';
}

export function generateAlert(weather: WeatherData): WeatherAlert | null {
  const hasStorm = weather.turns.some((t) => t.condition === 'thunderstorm');
  const hasHeavyRain = weather.turns.some((t) => t.rainProb >= 70);
  const highRainProb = weather.current.condition === 'thunderstorm' || weather.current.condition === 'rain';

  if (hasStorm || (hasHeavyRain && highRainProb)) {
    return {
      title: 'Aviso de Vigilancia IMHPA - Lluvias y Tormentas Significativas',
      severity: 'severe',
      summary: 'Se preveen chubascos con actividad electrica y rafagas de viento en las proximas horas.',
      details:
        'El Instituto de Meteorologia e Hidrologia de Panama (IMHPA) emite aviso de vigilancia por la presencia de un sistema de baja presion que genera chubascos aislados con tormentas electricas en distintas regiones del pais. Se recomienda a la poblacion mantenerse informada, evitar zonas propensas a inundaciones y seguir las indicaciones de las autoridades de Proteccion Civil.',
    };
  }

  if (hasHeavyRain) {
    return {
      title: 'Aviso Meteorologico IMHPA - Lluvias Moderadas',
      severity: 'moderate',
      summary: 'Se esperan lluvias moderadas durante el dia de hoy.',
      details:
        'El IMHPA informa sobre la probabilidad de lluvias moderadas en la region seleccionada. Se sugiere precaucion en vias con poca visibilidad y mantener atencion a boletines posteriores.',
    };
  }

  return null;
}
