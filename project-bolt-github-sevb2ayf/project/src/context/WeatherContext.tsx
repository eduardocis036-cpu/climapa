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
  error: string | null;
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

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>(loadSavedLocations);
  const [activeIndex, setActiveIndex] = useState(loadActiveIndex);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alert, setAlert] = useState<WeatherAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // F1: Store currentTurn in state, update periodically instead of recalculating every render
  const [currentTurn, setCurrentTurn] = useState(getCurrentTurnLabel());

  const lastFetchRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocationRef = useRef<SavedLocation | null>(null);
  // F3: Race-condition guard — incremented on each loadWeather call
  const requestIdRef = useRef(0);

  const currentLocation = locations[activeIndex] || locations[0] || null;

  // F11: Move ref assignment to useEffect (pure render)
  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  // F1: Update currentTurn label every 5 minutes instead of every render
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTurn(getCurrentTurnLabel());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeather = useCallback(
    async (loc: GeoLocation, isRefresh = false) => {
      // F3: Capture a unique ID for this request; if a newer request supersedes it, ignore the result
      const reqId = ++requestIdRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setWeather(null);
      }
      setError(null);
      try {
        const data = await fetchWeather(loc);
        // F3: Only apply if this is still the latest request
        if (reqId !== requestIdRef.current) return;
        setWeather(data);
        setAlert(generateAlert(data));
        lastFetchRef.current = Date.now();
      } catch {
        if (reqId !== requestIdRef.current) return;
        if (!isRefresh) {
          setError('No se pudieron cargar los datos del clima. Intenta de nuevo.');
        }
      } finally {
        // F3: Only update loading state if this is still the latest request
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

  // Initial load + load on location change
  useEffect(() => {
    if (currentLocation) {
      loadWeather(currentLocation);
    }
  }, [currentLocation, loadWeather]);

  // Persist locations
  useEffect(() => {
    saveLocations(locations);
  }, [locations]);

  // Persist active index
  useEffect(() => {
    saveActiveIndex(activeIndex);
  }, [activeIndex]);

  // Polling: refresh every 10 minutes
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

  // Visibility/focus: refetch if >10 min since last fetch
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
    setError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const loc = await reverseGeocode(latitude, longitude);
      setLocations((prev) => {
        const existIdx = prev.findIndex(
          (l) => Math.abs(l.lat - latitude) < 0.01 && Math.abs(l.lon - longitude) < 0.01
        );
        if (existIdx >= 0) {
          setActiveIndex(existIdx);
          return prev;
        }
        const newLoc = createSavedLocation(loc, { isMyLocation: true });
        const updated = prev.map((l) => ({ ...l, isMyLocation: false }));
        updated.push(newLoc);
        setActiveIndex(updated.length - 1);
        return updated;
      });
    } catch {
      setActiveIndex(0);
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const handleAddLocation = useCallback((loc: GeoLocation) => {
    setLocations((prev) => {
      const existIdx = prev.findIndex(
        (l) => Math.abs(l.lat - loc.lat) < 0.01 && Math.abs(l.lon - loc.lon) < 0.01
      );
      if (existIdx >= 0) {
        setActiveIndex(existIdx);
        return prev;
      }
      const newLoc = createSavedLocation(loc);
      setActiveIndex(prev.length);
      return [...prev, newLoc];
    });
  }, []);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      if (updated.length === 0) return prev;
      setActiveIndex((curr) => (curr >= updated.length ? updated.length - 1 : curr));
      return updated;
    });
  }, []);

  const handleSetHome = useCallback((id: string) => {
    setLocations((prev) => prev.map((l) => ({ ...l, isHome: l.id === id })));
  }, []);

  const handleSelectFromList = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // F1: Memoize the entire value object so consumers only re-render when actual values change
  const value = useMemo<WeatherContextValue>(
    () => ({
      locations,
      activeIndex,
      currentLocation,
      weather,
      alert,
      loading,
      refreshing,
      error,
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
      error,
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
