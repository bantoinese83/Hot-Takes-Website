import { Fragment, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { GeoGridCell, GeographyQueuePoint } from '../../lib/adminApi';
import { geoCellKey } from '../../lib/adminApi';
import 'leaflet/dist/leaflet.css';

const DARK_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const DEFAULT_ZOOM = 6;
const BRAND = { stroke: '#ff8a84', fill: '#ff544e', glow: 'rgba(255, 84, 78, 0.22)' };
const QUEUE = { stroke: '#7eb8ff', fill: '#4a9eff', glow: 'rgba(74, 158, 255, 0.35)' };
const SELECTED = { color: '#fff', fillColor: '#ff544e', fillOpacity: 0.75, weight: 3 };

type Props = {
  cells: GeoGridCell[];
  queuePoints?: GeographyQueuePoint[];
  showQueue?: boolean;
  selectedKey?: string | null;
  onSelectCell?: (cell: GeoGridCell | null) => void;
  height?: number;
};

function FitBounds({
  cells,
  queuePoints,
  showQueue,
}: {
  cells: GeoGridCell[];
  queuePoints: GeographyQueuePoint[];
  showQueue: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngTuple[] = cells.map((c) => [c.lat_bucket, c.lng_bucket]);
    if (showQueue) {
      for (const q of queuePoints) points.push([q.lat, q.lng]);
    }
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.4), { maxZoom: 11, animate: false });
    }
  }, [cells, queuePoints, showQueue, map]);

  return null;
}

function MapReset({ cells, queuePoints, showQueue }: { cells: GeoGridCell[]; queuePoints: GeographyQueuePoint[]; showQueue: boolean }) {
  const map = useMap();

  useEffect(() => {
    const control = new L.Control({ position: 'topright' });
    control.onAdd = () => {
      const wrap = L.DomUtil.create('div', 'admin-geo-map-reset-wrap');
      const btn = L.DomUtil.create('button', 'admin-geo-map-reset', wrap);
      btn.type = 'button';
      btn.textContent = 'Reset view';
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stop(e);
        const points: L.LatLngTuple[] = cells.map((c) => [c.lat_bucket, c.lng_bucket]);
        if (showQueue) for (const q of queuePoints) points.push([q.lat, q.lng]);
        if (points.length === 0) return;
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.4), { maxZoom: 11 });
      });
      return wrap;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [cells, queuePoints, showQueue, map]);

  return null;
}

export function GeoLeafletMap({
  cells,
  queuePoints = [],
  showQueue = false,
  selectedKey = null,
  onSelectCell,
  height = 480,
}: Props) {
  const maxCount = useMemo(() => Math.max(...cells.map((c) => c.count), 1), [cells]);
  const totalProfiles = useMemo(() => cells.reduce((n, c) => n + c.count, 0), [cells]);

  if (cells.length === 0 && (!showQueue || queuePoints.length === 0)) {
    return (
      <div className="admin-geo-empty">
        <p className="admin-empty">No geolocation buckets for this layer.</p>
        <p className="admin-geo-hint">
          Profiles need approximate location from the iOS app. Try &quot;All with location&quot; if match-ready is empty.
        </p>
      </div>
    );
  }

  const initialCenter: L.LatLngExpression =
    cells.length > 0 ? [cells[0].lat_bucket, cells[0].lng_bucket] : [queuePoints[0].lat, queuePoints[0].lng];

  return (
    <div className="admin-leaflet-shell admin-leaflet-shell--premium">
      <div className="admin-leaflet-map admin-leaflet-map--premium" style={{ height }}>
        <MapContainer
          center={initialCenter}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className="admin-leaflet-map-container"
        >
          <TileLayer attribution={DARK_ATTRIBUTION} url={DARK_TILE_URL} />
          <FitBounds cells={cells} queuePoints={queuePoints} showQueue={showQueue} />
          <MapReset cells={cells} queuePoints={queuePoints} showQueue={showQueue} />
          {cells.map((cell) => {
            const key = geoCellKey(cell.lat_bucket, cell.lng_bucket);
            const selected = selectedKey === key;
            const innerRadius = 8 + (cell.count / maxCount) * 16;
            const glowRadius = innerRadius + 10;
            return (
              <Fragment key={key}>
                <CircleMarker
                  center={[cell.lat_bucket, cell.lng_bucket]}
                  radius={glowRadius}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: BRAND.glow,
                    fillOpacity: selected ? 0.85 : 0.55,
                    weight: 0,
                  }}
                  eventHandlers={{
                    click: () => onSelectCell?.(cell),
                  }}
                />
                <CircleMarker
                  center={[cell.lat_bucket, cell.lng_bucket]}
                  radius={innerRadius}
                  pathOptions={
                    selected
                      ? SELECTED
                      : { color: BRAND.stroke, fillColor: BRAND.fill, fillOpacity: 0.65, weight: 2 }
                  }
                  eventHandlers={{
                    click: () => onSelectCell?.(cell),
                  }}
                >
                  <Popup className="admin-geo-popup">
                    <div className="admin-geo-popup-inner">
                      <strong>{cell.count}</strong> profile{cell.count === 1 ? '' : 's'}
                      <div className="admin-geo-popup-coords">
                        {cell.lat_bucket.toFixed(1)}°N · {cell.lng_bucket.toFixed(1)}°E
                      </div>
                      <p className="admin-geo-popup-note">~11 km privacy bucket (0.1°)</p>
                    </div>
                  </Popup>
                </CircleMarker>
              </Fragment>
            );
          })}
          {showQueue
            ? queuePoints.map((q) => (
                <CircleMarker
                  key={q.user_id}
                  center={[q.lat, q.lng]}
                  radius={7}
                  pathOptions={{
                    color: QUEUE.stroke,
                    fillColor: QUEUE.fill,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <strong>{q.name ?? 'User'}</strong>
                    <br />
                    <span className="admin-badge admin-badge--muted">{q.status}</span>
                    {q.location_label ? (
                      <>
                        <br />
                        {q.location_label}
                      </>
                    ) : null}
                  </Popup>
                </CircleMarker>
              ))
            : null}
        </MapContainer>
      </div>
      <div className="admin-geo-legend admin-geo-legend--premium">
        <span>
          <i className="admin-geo-legend-dot" /> Density buckets (~0.1°)
        </span>
        {showQueue ? (
          <span>
            <i className="admin-geo-legend-dot admin-geo-legend-dot--queue" /> Live queue ({queuePoints.length})
          </span>
        ) : null}
        <span>
          {cells.length} bucket{cells.length === 1 ? '' : 's'} · {totalProfiles} profiles mapped
        </span>
      </div>
    </div>
  );
}
