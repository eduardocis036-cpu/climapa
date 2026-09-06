import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { Satellite, X, Maximize2, Loader2 } from 'lucide-react';

interface Props {
  lat: number;
  lon: number;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

interface RadarFrame {
  time: number;
  path: string;
}

function createMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: '<div style="width:14px;height:14px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(239,68,68,0.6);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function MapRecenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: true });
  }, [lat, lon, map]);
  return null;
}

function RadarAnimation({
  frames,
  map,
}: {
  frames: RadarFrame[];
  map: L.Map | null;
}) {
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const frameIdxRef = useRef(0);

  useEffect(() => {
    if (!map || frames.length === 0) return;

    const interval = setInterval(() => {
      frameIdxRef.current = (frameIdxRef.current + 1) % frames.length;
      const frame = frames[frameIdxRef.current];
      const url = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current);
      }

      const newLayer = L.tileLayer(url, {
        opacity: 0.65,
        zIndex: 100,
      });
      newLayer.addTo(map);
      radarLayerRef.current = newLayer;
    }, 700);

    return () => {
      clearInterval(interval);
      if (radarLayerRef.current && map) {
        map.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
    };
  }, [frames, map]);

  return null;
}

function MapController({
  lat,
  lon,
  frames,
  onMapReady,
}: {
  lat: number;
  lon: number;
  frames: RadarFrame[];
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();
  const radarTileUrl =
    frames.length > 0
      ? `https://tilecache.rainviewer.com${frames[frames.length - 1].path}/256/{z}/{x}/{y}/2/1_1.png`
      : '';

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {radarTileUrl && (
        <TileLayer url={radarTileUrl} opacity={0.65} zIndex={100} />
      )}
      <Marker position={[lat, lon]} icon={createMarkerIcon()} />
      <MapRecenter lat={lat} lon={lon} />
      <RadarAnimation frames={frames} map={map} />
    </>
  );
}

export default function RadarMap({ lat, lon, fullscreen, onToggleFullscreen }: Props) {
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarLoading, setRadarLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRadarLoading(true);
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.radar?.past?.length > 0) {
          setRadarFrames(data.radar.past);
        }
        setRadarLoading(false);
      })
      .catch(() => {
        if (!cancelled) setRadarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMapReady = useRef((m: L.Map) => {
    setMapInstance(m);
  }).current;

  const latestFrame = radarFrames.length > 0 ? radarFrames[radarFrames.length - 1] : null;

  return (
    <>
      {/* Card view */}
      <div
        className="glass-card rounded-3xl overflow-hidden animate-fade-in-up stagger-7 cursor-pointer group"
        onClick={onToggleFullscreen}
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <Satellite size={16} className="text-white/70" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-white">Radar Meteorologico Panama</h2>
          </div>
          <Maximize2 size={16} className="text-white/40 group-hover:text-white/70 transition-colors" strokeWidth={1.5} />
        </div>

        <div className="relative h-48 sm:h-56 mx-3 mb-3 rounded-2xl overflow-hidden bg-slate-800">
          <MapContainer
            key={`card-${lat}-${lon}`}
            center={[lat, lon]}
            zoom={8}
            style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
            zoomControl={false}
            attributionControl={false}
          >
            <MapController lat={lat} lon={lon} frames={radarFrames} onMapReady={handleMapReady} />
          </MapContainer>

          <div className="absolute bottom-2 left-2 glass-card rounded-full px-2.5 py-1 flex items-center gap-1.5 z-[400] pointer-events-none">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-[10px] font-medium text-white">Imagenes en vivo - IMHPA</span>
          </div>

          <div className="absolute top-2 right-2 glass-card rounded-lg px-2 py-1.5 flex items-center gap-1 z-[400] pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>

          {radarLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 z-[500] pointer-events-none">
              <Loader2 size={20} className="animate-spin text-white/60" />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal — reuses same map instance, no second MapContainer */}
      {fullscreen && mapInstance && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-fade-in"
          onClick={onToggleFullscreen}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Satellite size={20} className="text-white/80" strokeWidth={1.5} />
              <span className="text-white font-semibold">Radar Meteorologico Panama / GOES-East</span>
            </div>
            <button className="glass-card rounded-full p-2 text-white/80 hover:text-white">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 mx-4 mb-4 rounded-3xl overflow-hidden bg-slate-800 relative">
            {/* The card's map container is repositioned here via a portal-like approach.
                We render a new MapContainer only for fullscreen with a different key to avoid conflicts. */}
            <MapContainer
              key={`modal-${lat}-${lon}`}
              center={[lat, lon]}
              zoom={8}
              style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
              zoomControl={true}
              attributionControl={false}
            >
              <MapController lat={lat} lon={lon} frames={radarFrames} onMapReady={() => {}} />
            </MapContainer>

            <div className="absolute top-4 right-4 glass-card rounded-2xl p-3 space-y-1.5 z-[1000] pointer-events-none">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-1">Intensidad</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-white/70">Lluvia ligera</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-white/70">Moderada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-white/70">Fuerte</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-white/70">Torrencial</span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 glass-card rounded-full px-3 py-1.5 flex items-center gap-2 z-[1000] pointer-events-none">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs font-medium text-white">Imagenes en vivo - IMHPA</span>
            </div>

            {latestFrame && (
              <div className="absolute bottom-4 right-4 glass-card rounded-lg px-3 py-2 z-[1000] pointer-events-none">
                <p className="text-[10px] text-white/50">Fuente: RainViewer API</p>
                <p className="text-[10px] text-white/40">
                  {new Date(latestFrame.time * 1000).toLocaleTimeString('es-PA')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
