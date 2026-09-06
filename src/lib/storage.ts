import type { SavedLocation, WeatherData } from '@/types';
import { DEFAULT_LOCATION } from '@/config/panamaLocations';

const LOCATIONS_KEY = 'panama_weather_saved_locations';
const ACTIVE_KEY = 'panama_weather_active_index';
const WEATHER_KEY = 'panama_weather_last_weather';
const LAST_FETCH_KEY = 'panama_weather_last_fetch';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function isValidSavedLocation(obj: unknown): obj is SavedLocation {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.displayName === 'string' &&
    typeof o.lat === 'number' &&
    typeof o.lon === 'number' &&
    typeof o.isHome === 'boolean' &&
    typeof o.isMyLocation === 'boolean'
  );
}

export function loadSavedLocations(): SavedLocation[] {
  try {
    const saved = localStorage.getItem(LOCATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(isValidSavedLocation);
        if (valid.length > 0) {
          return valid;
        }
      }
    }
  } catch {
    // ignore
  }
  return [
    {
      ...DEFAULT_LOCATION,
      id: generateId(),
      isHome: false,
      isMyLocation: true,
    },
  ];
}

export function saveLocations(locations: SavedLocation[]): void {
  try {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  } catch {
    // ignore
  }
}

export function loadActiveIndex(): number {
  try {
    const idx = localStorage.getItem(ACTIVE_KEY);
    if (idx !== null) {
      const n = parseInt(idx, 10);
      if (!isNaN(n) && n >= 0) return n;
    }
  } catch {
    // ignore
  }
  return 0;
}

export function saveActiveIndex(idx: number): void {
  try {
    localStorage.setItem(ACTIVE_KEY, idx.toString());
  } catch {
    // ignore
  }
}

export function loadSavedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.current) {
        return parsed as WeatherData;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveWeather(data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadLastFetch(): number {
  try {
    const raw = localStorage.getItem(LAST_FETCH_KEY);
    if (raw !== null) {
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  } catch {
    // ignore
  }
  return 0;
}

export function saveLastFetch(timestamp: number): void {
  try {
    localStorage.setItem(LAST_FETCH_KEY, timestamp.toString());
  } catch {
    // ignore
  }
}

export function createSavedLocation(
  loc: { name: string; displayName: string; lat: number; lon: number },
  opts: { isHome?: boolean; isMyLocation?: boolean } = {}
): SavedLocation {
  return {
    ...loc,
    id: generateId(),
    isHome: opts.isHome ?? false,
    isMyLocation: opts.isMyLocation ?? false,
  };
}
