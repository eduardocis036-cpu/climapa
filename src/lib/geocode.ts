import type { GeoLocation } from '@/types';
import { DEFAULT_LOCATION } from '@/config/panamaLocations';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
  boundingbox?: string[];
}

function extractPanamaName(result: NominatimResult): string {
  const addr = result.address;
  if (!addr) return result.name || result.display_name.split(',')[0];

  const parts: string[] = [];
  if (addr.neighbourhood) parts.push(addr.neighbourhood);
  if (addr.suburb) parts.push(addr.suburb);
  if (addr.residential) parts.push(addr.residential);
  if (addr.hamlet) parts.push(addr.hamlet);
  if (addr.village) parts.push(addr.village);
  if (addr.town) parts.push(addr.town);
  if (addr.city_district) parts.push(addr.city_district);
  if (addr.city) parts.push(addr.city);
  if (addr.county) parts.push(addr.county);
  if (addr.state) parts.push(addr.state);

  if (parts.length > 0) {
    return parts.slice(0, 2).join(', ');
  }

  return result.name || result.display_name.split(',')[0];
}

const EXCLUDED_CLASSES = new Set(['amenity', 'shop', 'building', 'tourism', 'leisure', 'office', 'healthcare', 'education']);
const EXCLUDED_TYPES = new Set(['yes', 'house', 'detached', 'apartments', 'commercial', 'retail', 'warehouse', 'parking', 'school', 'hospital', 'clinic', 'restaurant', 'cafe', 'bar', 'fast_food', 'pharmacy', 'bank', 'atm', 'fuel', 'place_of_worship', 'park', 'playground', 'cinema', 'theatre', 'library', 'museum', 'hotel', 'motel', 'guest_house', 'supermarket', 'convenience', 'mall', 'clothes', 'bakery', 'restaurant']);

function isPopulatedPlace(result: NominatimResult): boolean {
  if (result.class && EXCLUDED_CLASSES.has(result.class)) return false;
  if (result.type && EXCLUDED_TYPES.has(result.type)) return false;

  const allowedClasses = new Set(['place', 'boundary', 'highway']);
  if (result.class && allowedClasses.has(result.class)) return true;

  const allowedTypes = new Set([
    'city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood',
    'residential', 'county', 'state', 'region', 'province',
    'city_district', 'administrative', 'postal_town',
  ]);
  if (result.type && allowedTypes.has(result.type)) return true;

  return false;
}

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&countrycodes=pa&format=json&limit=15&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es' },
    });

    if (!res.ok) return [];

    const data: NominatimResult[] = await res.json();

    const filtered = data.filter(isPopulatedPlace);

    const seen = new Set<string>();
    const deduped: GeoLocation[] = [];
    for (const r of filtered) {
      const name = extractPanamaName(r);
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push({
        name,
        displayName: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
      });
    }

    return deduped;
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es' },
    });

    if (!res.ok) throw new Error('Reverse geocoding failed');

    const data: NominatimResult = await res.json();
    return {
      name: extractPanamaName(data),
      displayName: data.display_name,
      lat,
      lon,
    };
  } catch {
    return { ...DEFAULT_LOCATION, lat, lon };
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}
