import type { SavedLocation } from '@/types';
import { DEFAULT_LOCATION } from '@/config/panamaLocations';

const LOCATIONS_KEY = 'panama_weather_saved_locations';
const ACTIVE_KEY = 'panama_weather_active_index';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function loadSavedLocations(): SavedLocation[] {
  try {
    const saved = localStorage.getItem(LOCATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SavedLocation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
