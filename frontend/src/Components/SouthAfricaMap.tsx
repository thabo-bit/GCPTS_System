import React, { useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';

interface ProjectLocation {
  id: number;
  title: string;
  province?: string;
  community?: string;
  gpsCoordinates?: string;
}

interface SouthAfricaMapProps {
  selectedProvince: string | null;
  onSelectProvince: (provName: string | null) => void;
  projects?: ProjectLocation[];
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '440px',
  borderRadius: '12px',
};

const center = { lat: -28.4793, lng: 24.6727 };

const SOUTH_AFRICA_BOUNDS = {
  north: -22.0,
  south: -35.0,
  west: 16.0,
  east: 33.0,
};

/* ---- Custom SVG map pin as data-URI ---- */
const buildPin = (color: string, size: number) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 40">
      <defs>
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#0f172a" flood-opacity="0.28"/>
        </filter>
      </defs>
      <path d="M16 1C8.3 1 2 7.3 2 15c0 9.6 12.2 22.4 13.2 23.5a1.1 1.1 0 0 0 1.6 0C17.8 37.4 30 24.6 30 15 30 7.3 23.7 1 16 1z"
            fill="${color}" stroke="#ffffff" stroke-width="2" filter="url(#s)"/>
      <circle cx="16" cy="15" r="5.2" fill="#ffffff"/>
    </svg>
  `)}`;

const PIN_BLUE   = buildPin('#3b82f6', 30);
const PIN_RED    = buildPin('#ef4444', 26);
const PIN_MUTED  = buildPin('#cbd5e1', 20);

/* ---- Province fallback centroids ---- */
const PROVINCE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Gauteng':        { lat: -26.2041, lng: 28.0473 },
  'Western Cape':   { lat: -33.9249, lng: 18.4241 },
  'KwaZulu-Natal':  { lat: -29.8587, lng: 31.0218 },
  'Eastern Cape':   { lat: -32.9598, lng: 27.9116 },
  'Free State':     { lat: -29.0852, lng: 26.1596 },
  'Mpumalanga':     { lat: -25.4658, lng: 30.9853 },
  'Limpopo':        { lat: -23.9045, lng: 29.4689 },
  'North West':     { lat: -25.8672, lng: 25.6341 },
  'Northern Cape':  { lat: -29.0467, lng: 21.8569 },
};

const parseCoordinates = (gps?: string, province?: string) => {
  if (gps && gps.includes(',')) {
    const [la, ln] = gps.split(',');
    const lat = parseFloat(la.trim());
    const lng = parseFloat(ln.trim());
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return PROVINCE_CENTROIDS[province || ''] || { lat: -28.7282, lng: 24.7499 };
};

/* Small deterministic offset so pins in the same province don't stack */
const jitter = (id: number) => {
  const a = ((id * 9301 + 49297) % 233280) / 233280;
  const b = ((id * 4523 + 12347) % 233280) / 233280;
  return { dx: (a - 0.5) * 0.35, dy: (b - 0.5) * 0.35 };
};

export default function SouthAfricaMap({
  selectedProvince,
  onSelectProvince,
  projects = [],
}: SouthAfricaMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyAtU110neEfr6fbua2-omXWpKEC2Oo6K2U',
  });

  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);

  const provinces = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.province && s.add(p.province));
    return Array.from(s).sort();
  }, [projects]);

  if (loadError) {
    return (
      <div
        style={{
          ...containerStyle,
          background: '#f8fafc',
          border: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '14px',
        }}
      >
        Map unavailable
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          ...containerStyle,
          background: '#f8fafc',
          border: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '14px',
        }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #f1f5f9',
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={5.5}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            minZoom: 5,
            restriction: {
              latLngBounds: SOUTH_AFRICA_BOUNDS,
              strictBounds: true,
            },
          }}
        >
          {projects.map((project) => {
            const base = parseCoordinates(project.gpsCoordinates, project.province);
            const { dx, dy } = jitter(project.id);
            const pos = { lat: base.lat + dy, lng: base.lng + dx };
            const isSelected = selectedProvince === project.province;
            const dimmed = !!selectedProvince && !isSelected;

            return (
              <MarkerF
                key={project.id}
                position={pos}
                onClick={() => {
                  setActiveMarkerId(project.id);
                  if (project.province) {
                    onSelectProvince(
                      selectedProvince === project.province ? null : project.province
                    );
                  }
                }}
                icon={{
                  url: isSelected ? PIN_BLUE : dimmed ? PIN_MUTED : PIN_RED,
                  scaledSize: new google.maps.Size(
                    isSelected ? 30 : dimmed ? 20 : 26,
                    isSelected ? 38 : dimmed ? 25 : 33
                  ),
                  anchor: new google.maps.Point(
                    isSelected ? 15 : dimmed ? 10 : 13,
                    isSelected ? 30 : dimmed ? 20 : 26
                  ),
                }}
              />
            );
          })}

          {activeMarkerId != null &&
            (() => {
              const p = projects.find((x) => x.id === activeMarkerId);
              if (!p) return null;
              const base = parseCoordinates(p.gpsCoordinates, p.province);
              const { dx, dy } = jitter(p.id);
              return (
                <InfoWindowF
                  position={{ lat: base.lat + dy, lng: base.lng + dx }}
                  onCloseClick={() => setActiveMarkerId(null)}
                  options={{ maxWidth: 260, pixelOffset: new google.maps.Size(0, -6) }}
                >
                  <div
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      padding: '4px 2px',
                      color: '#0f172a',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        lineHeight: 1.3,
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 21s-7-5.7-7-11a7 7 0 1 1 14 0c0 5.3-7 11-7 11z"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                        <circle cx="12" cy="10" r="2.5" stroke="#94a3b8" strokeWidth="2" />
                      </svg>
                      {p.community || 'Local Area'}
                      {p.province ? `, ${p.province}` : ''}
                    </div>
                  </div>
                </InfoWindowF>
              );
            })()}
        </GoogleMap>
      </div>

      {/* Province rail below the map */}
      {provinces.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <ProvinceChip
            label="All provinces"
            active={selectedProvince === null}
            onClick={() => onSelectProvince(null)}
          />
          {provinces.map((prov) => (
            <ProvinceChip
              key={prov}
              label={prov}
              active={selectedProvince === prov}
              onClick={() =>
                onSelectProvince(selectedProvince === prov ? null : prov)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Province chip ---- */

const ProvinceChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '7px 14px',
        borderRadius: '999px',
        border: `1px solid ${active ? '#0f172a' : hover ? '#e2e8f0' : '#f1f5f9'}`,
        background: active ? '#0f172a' : hover ? '#f8fafc' : '#ffffff',
        color: active ? '#ffffff' : '#475569',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
};