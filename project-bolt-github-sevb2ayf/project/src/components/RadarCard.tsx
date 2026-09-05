import { useState, useEffect } from 'react';
import { Satellite, X, Maximize2, Loader2, ExternalLink } from 'lucide-react';

interface Props {
  lat: number;
  lon: number;
}

interface RadarFrame {
  time: number;
  path: string;
}

function lon2tileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function buildRadarOverlayUrl(framePath: string, lat: number, lon: number, zoom: number, width: number, height: number): string {
  const centerX = lon2tileX(lon, zoom);
  const centerY = lat2tileY(lat, zoom);
  const halfW = width / 512;
  const halfH = height / 512;

  const minTileX = Math.floor(centerX - halfW);
  const maxTileX = Math.ceil(centerX + halfW);
  const minTileY = Math.floor(centerY - halfH);
  const maxTileY = Math.ceil(centerY + halfH);

  const tilesX = maxTileX - minTileX;
  const tilesY = maxTileY - minTileY;

  const tiles: string[] = [];
  for (let ty = minTileY; ty < maxTileY; ty++) {
    for (let tx = minTileX; tx < maxTileX; tx++) {
      const wrappedTx = ((tx % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
      const wrappedTy = Math.max(0, Math.min(ty, Math.pow(2, zoom) - 1));
      tiles.push(`https://tilecache.rainviewer.com${framePath}/256/${zoom}/${wrappedTx}/${wrappedTy}/2/1_1.png`);
    }
  }

  return tiles.join(',');
}

const ZOOM = 8;
const CARD_W = 384;
const CARD_H = 224;
const FULL_W = 768;
const FULL_H = 600;

export default function RadarCard({ lat, lon }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarLoading, setRadarLoading] = useState(true);

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

  const latestFrame = radarFrames.length > 0 ? radarFrames[radarFrames.length - 1] : null;

  const mapBounds = {
    minLon: -83.5,
    maxLon: -77.0,
    minLat: 7.0,
    maxLat: 9.8,
  };

  const markerX = ((lon - mapBounds.minLon) / (mapBounds.maxLon - mapBounds.minLon)) * 100;
  const markerY = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapBounds.minLon}%2C${mapBounds.minLat}%2C${mapBounds.maxLon}%2C${mapBounds.maxLat}&layer=mapnik&marker=${lat}%2C${lon}`;

  const cardRadarTiles = latestFrame
    ? buildRadarOverlayUrl(latestFrame.path, lat, lon, ZOOM, CARD_W, CARD_H)
    : '';
  const fullRadarTiles = latestFrame
    ? buildRadarOverlayUrl(latestFrame.path, lat, lon, ZOOM, FULL_W, FULL_H)
    : '';

  const cardTileList = cardRadarTiles ? cardRadarTiles.split(',') : [];
  const fullTileList = fullRadarTiles ? fullRadarTiles.split(',') : [];

  function renderRadarTiles(tiles: string[], w: number, h: number) {
    const zoom = ZOOM;
    const centerX = lon2tileX(lon, zoom);
    const centerY = lat2tileY(lat, zoom);
    const halfW = w / 512;
    const halfH = h / 512;
    const minTileX = Math.floor(centerX - halfW);
    const minTileY = Math.floor(centerY - halfH);

    const tilesX = Math.ceil((lon2tileX(lon, zoom) + halfW) - minTileX);
    const tilesY = Math.ceil((lat2tileY(lat, zoom) + halfH) - minTileY);

    const offsetX = -((centerX - halfW - minTileX) * 256);
    const offsetY = -((centerY - halfH - minTileY) * 256);

    let idx = 0;
    const elements: React.ReactNode[] = [];
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        if (idx < tiles.length) {
          elements.push(
            <img
              key={`tile-${tx}-${ty}`}
              src={tiles[idx]}
              alt=""
              className="absolute"
              style={{
                left: `${offsetX + tx * 256}px`,
                top: `${offsetY + ty * 256}px`,
                width: '256px',
                height: '256px',
                opacity: 0.7,
                imageRendering: 'auto',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          );
          idx++;
        }
      }
    }
    return elements;
  }

  return (
    <>
      <div
        className="glass-card rounded-3xl overflow-hidden animate-fade-in-up stagger-7 cursor-pointer group"
        onClick={() => setFullscreen(true)}
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <Satellite size={16} className="text-white/70" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-white">Radar Meteorologico Panama</h2>
          </div>
          <Maximize2 size={16} className="text-white/40 group-hover:text-white/70 transition-colors" strokeWidth={1.5} />
        </div>

        <div className="relative h-48 sm:h-56 mx-3 mb-3 rounded-2xl overflow-hidden bg-slate-800">
          <iframe
            title="Radar Panama"
            src={osmEmbedUrl}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none', filter: 'invert(0.92) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.7)' }}
            loading="lazy"
          />

          {/* Real RainViewer radar tiles overlay */}
          {cardTileList.length > 0 && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
              style={{ mixBlendMode: 'screen' }}
            >
              <div className="relative" style={{ width: `${CARD_W}px`, height: `${CARD_H}px` }}>
                {renderRadarTiles(cardTileList, CARD_W, CARD_H)}
              </div>
            </div>
          )}

          <div
            className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${markerX}%`, top: `${markerY}%` }}
          >
            <div className="w-full h-full bg-red-500 rounded-full border-2 border-white shadow-lg" />
          </div>

          <div className="absolute bottom-2 left-2 glass-card rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-[10px] font-medium text-white">Imagenes en vivo - IMHPA</span>
          </div>

          <div className="absolute top-2 right-2 glass-card rounded-lg px-2 py-1.5 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>

          {radarLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
              <Loader2 size={20} className="animate-spin text-white/60" />
            </div>
          )}
        </div>
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-fade-in"
          onClick={() => setFullscreen(false)}
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
            <iframe
              title="Radar Panama Fullscreen"
              src={osmEmbedUrl}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none', filter: 'invert(0.92) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.7)' }}
              loading="lazy"
            />

            {/* Real RainViewer radar tiles overlay - fullscreen */}
            {fullTileList.length > 0 && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
                style={{ mixBlendMode: 'screen' }}
              >
                <div className="relative" style={{ width: `${FULL_W}px`, height: `${FULL_H}px` }}>
                  {renderRadarTiles(fullTileList, FULL_W, FULL_H)}
                </div>
              </div>
            )}

            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${markerX}%`, top: `${markerY}%` }}
            >
              <div className="w-full h-full bg-red-500 rounded-full border-2 border-white shadow-lg" />
            </div>

            <div className="absolute top-4 right-4 glass-card rounded-2xl p-3 space-y-1.5">
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

            <div className="absolute bottom-4 left-4 glass-card rounded-full px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-xs font-medium text-white">Imagenes en vivo - IMHPA</span>
            </div>

            {latestFrame && (
              <div className="absolute bottom-4 right-4 glass-card rounded-lg px-3 py-2">
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
