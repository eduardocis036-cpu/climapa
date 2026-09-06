import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import type { GeoLocation, SavedLocation, WeatherData, WeatherAlert } from '@/types';
import { getCurrentPosition, reverseGeocode } from '@/lib/geocode';
import { fetchWeather, generateAlert, getCurrentTurnLabel } from '@/lib/weatherApi';
import {
  loadSavedLocations,
  saveLocations,
  loadActiveIndex,
  saveActiveIndex,
  createSavedLocation,
} from '@/lib/storage';

const POLL_INTERVAL = 10 * 60 * 1000;

interface WeatherContextValue {
  locations: SavedLocation[];
  activeIndex: number;
  currentLocation: SavedLocation | null;
  weather: WeatherData | null;
  alert: WeatherAlert | null;
  loading: boolean;
  refreshing: boolean;
  refreshError: string | null;
  error: string | null;
  gpsError: string | null;
  gpsLoading: boolean;
  currentTurn: string;
  showSaved: boolean;
  showSearch: boolean;
  setActiveIndex: (idx: number) => void;
  setShowSaved: (v: boolean) => void;
  setShowSearch: (v: boolean) => void;
  refresh: () => void;
  handleUseGPS: () => Promise<void>;
  handleAddLocation: (loc: GeoLocation) => void;
  handleRemoveLocation: (id: string) => void;
  handleSetHome: (id: string) => void;
  handleSelectFromList: (index: number) => void;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

function getGpsErrorMessage(err: unknown): string {
  if (err instanceof GeolocationPositionError) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Permiso de ubicacion denegado. Activa el acceso en la configuracion del navegador.';
      case err.POSITION_UNAVAILABLE:
        return 'GPS no disponible. Verifica que el GPS este activado en tu dispositivo.';
      case err.TIMEOUT:
        return 'Tiempo agotado esperando la ubicacion. Intenta de nuevo.';
      default:
        return 'No se pudo obtener tu ubicacion. Intenta de nuevo.';
    }
  }
  if (err instanceof Error) {
    if (err.message.includes('not supported')) {
      return 'Tu dispositivo no soporta geolocalizacion.';
    }
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return 'Error de red al obtener tu ubicacion. Verifica tu conexion.';
    }
    return 'No se pudo obtener tu ubicacion. Intenta de nuevo.';
  }
  return 'No se pudo obtener tu ubicacion. Intenta de nuevo.';
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>(loadSavedLocations);
  const [activeIndex, setActiveIndex] = useState(loadActiveIndex);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alert, setAlert] = useState<WeatherAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(getCurrentTurnLabel());

  const lastFetchRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocationRef = useRef<SavedLocation | null>(null);
  const requestIdRef = useRef(0);

  const currentLocation = locations[activeIndex] || locations[0] || null;

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTurn(getCurrentTurnLabel());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeather = useCallback(
    async (loc: GeoLocation, isRefresh = false) => {
      const reqId = ++requestIdRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setWeather(null);
      }
      setError(null);
      if (isRefresh) setRefreshError(null);
      try {
        const data = await fetchWeather(loc);
        if (reqId !== requestIdRef.current) return;
        setWeather(data);
        setAlert(generateAlert(data));
        lastFetchRef.current = Date.now();
      } catch {
        if (reqId !== requestIdRef.current) return;
        if (isRefresh) {
          setRefreshError('Datos no actualizados — sin conexion');
        } else {
          setError('No se pudieron cargar los datos del clima. Intenta de nuevo.');
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  const refresh = useCallback(() => {
    const loc = currentLocationRef.current;
    if (loc) loadWeather(loc, true);
  }, [loadWeather]);

  useEffect(() => {
    if (currentLocation) {
      loadWeather(currentLocation);
    }
  }, [currentLocation, loadWeather]);

  useEffect(() => {
    saveLocations(locations);
  }, [locations]);

  useEffect(() => {
    saveActiveIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed >= POLL_INTERVAL) {
        refresh();
      }
    }, POLL_INTERVAL);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchRef.current;
        if (elapsed >= POLL_INTERVAL) {
          refresh();
        }
      }
    };
    const handleFocus = () => {
      const elapsed = Date.now() - lastFetchRef.current;
      if (elapsed >= POLL_INTERVAL) {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

  const handleUseGPS = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);
    setError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const loc = await reverseGeocode(latitude, longitude);
      const existIdx = locations.findIndex(
        (l) => Math.abs(l.lat - latitude) < 0.01 && Math.abs(l.lon - longitude) < 0.01
      );
      if (existIdx >= 0) {
        setActiveIndex(existIdx);
      } else {
        const newLoc = createSavedLocation(loc, { isMyLocation: true });
        const updated = locations.map((l) => ({ ...l, isMyLocation: false }));
        updated.push(newLoc);
        setLocations(updated);
        setActiveIndex(updated.length - 1);
      }
    } catch (err) {
      setGpsError(getGpsErrorMessage(err));
      setActiveIndex(0);
    } finally {
      setGpsLoading(false);
    }
  }, [locations]);

  const handleAddLocation = useCallback((loc: GeoLocation) => {
    const existIdx = locations.findIndex(
      (l) => Math.abs(l.lat - loc.lat) < 0.01 && Math.abs(l.lon - loc.lon) < 0.01
    );
    if (existIdx >= 0) {
      setActiveIndex(existIdx);
      return;
    }
    const newLoc = createSavedLocation(loc);
    setLocations([...locations, newLoc]);
    setActiveIndex(locations.length);
  }, [locations]);

  const handleRemoveLocation = useCallback((id: string) => {
    const updated = locations.filter((l) => l.id !== id);
    if (updated.length === 0) return;
    setLocations(updated);
    setActiveIndex((curr) => (curr >= updated.length ? updated.length - 1 : curr));
  }, [locations]);

  const handleSetHome = useCallback((id: string) => {
    setLocations((prev) => prev.map((l) => ({ ...l, isHome: l.id === id })));
  }, []);

  const handleSelectFromList = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const value = useMemo<WeatherContextValue>(
    () => ({
      locations,
      activeIndex,
      currentLocation,
      weather,
      alert,
      loading,
      refreshing,
      refreshError,
      error,
      gpsError,
      gpsLoading,
      currentTurn,
      showSaved,
      showSearch,
      setActiveIndex,
      setShowSaved,
      setShowSearch,
      refresh,
      handleUseGPS,
      handleAddLocation,
      handleRemoveLocation,
      handleSetHome,
      handleSelectFromList,
    }),
    [
      locations,
      activeIndex,
      currentLocation,
      weather,
      alert,
      loading,
      refreshing,
      refreshError,
      error,
      gpsError,
      gpsLoading,
      currentTurn,
      showSaved,
      showSearch,
      refresh,
      handleUseGPS,
      handleAddLocation,
      handleRemoveLocation,
      handleSetHome,
      handleSelectFromList,
    ]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
}
