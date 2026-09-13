import React, { useState, useEffect, useRef } from 'react';
import {
  Hospital,
  MapPin,
  Phone,
  Clock,
  Shield,
  Navigation,
  Activity,
  Bed,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import L from 'leaflet';
import { HealthcareFacility, UrgencyLevel } from '../types';
import { FALLBACK_FACILITIES } from '../data/mockData';

interface NearbyFacilitiesViewProps {
  urgency: UrgencyLevel | null;
  userCoords: { lat: number; lng: number } | null;
}

export const NearbyFacilitiesView: React.FC<NearbyFacilitiesViewProps> = ({
  urgency,
  userCoords,
}) => {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>(FALLBACK_FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);
  const [filterType, setFilterType] = useState<string>(urgency || 'ALL');
  const [loading, setLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const defaultLat = userCoords?.lat || 28.6139;
  const defaultLng = userCoords?.lng || 77.2090;

  // Fetch facilities from backend
  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/facilities/nearby?lat=${defaultLat}&lng=${defaultLng}&category=${filterType}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.facilities && data.facilities.length > 0) {
            setFacilities(data.facilities);
            if (!selectedFacility) setSelectedFacility(data.facilities[0]);
          }
        }
      } catch (err) {
        console.warn('Using fallback facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [filterType, defaultLat, defaultLng]);

  // Leaflet OpenStreetMap Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([defaultLat, defaultLng], 13);
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // User Location Pulse Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="width: 18px; height: 18px; background: #e11d48; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(225,29,72,0.8);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const userMarker = L.marker([defaultLat, defaultLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Current Location</b><br/>Emergency GPS Reference');
    markersRef.current.push(userMarker);

    // Facility Markers
    facilities.forEach((fac) => {
      const isTrauma1 = fac.traumaLevel === 'Level I';
      const markerColor = isTrauma1 ? '#e11d48' : '#2563eb';

      const facIcon = L.divIcon({
        className: 'custom-fac-marker',
        html: `<div style="display:flex; align-items:center; justify-content:center; width: 28px; height: 28px; background: ${markerColor}; color: white; border: 2px solid white; border-radius: 8px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">H</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([fac.lat, fac.lng], { icon: facIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 180px;">
            <b style="font-size: 13px;">${fac.name}</b><br/>
            <span style="color: #64748b; font-size: 11px;">${fac.type}</span><br/>
            <div style="margin-top: 4px; font-size: 11px;">
              <b>Distance:</b> ${fac.distanceMiles} mi (${fac.distanceKm} km)<br/>
              <b>Wait Time:</b> ~${fac.estimatedWaitMinutes} mins<br/>
              <b>Emergency Tel:</b> <a href="tel:${fac.emergencyPhone}">${fac.emergencyPhone}</a>
            </div>
          </div>
        `);

      marker.on('click', () => {
        setSelectedFacility(fac);
      });

      markersRef.current.push(marker);
    });

    // Invalidate size in case of container size shift
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [facilities, defaultLat, defaultLng]);

  const handleSelectFacility = (fac: HealthcareFacility) => {
    setSelectedFacility(fac);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([fac.lat, fac.lng], 14, { duration: 1 });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Triage Match Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none transition-colors">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Hospital className="w-5 h-5" />
            </div>
            Nearby Emergency Healthcare Facilities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time trauma centers, emergency departments, and acute care facilities with live ICU telemetry.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Facilities
          </button>
          <button
            onClick={() => setFilterType('CRITICAL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Level 1 & Trauma
          </button>
          <button
            onClick={() => setFilterType('MODERATE')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'MODERATE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Urgent Care & ER
          </button>
        </div>
      </div>

      {/* Grid: Interactive Map + Facilities List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OpenStreetMap Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Live OpenStreetMap GIS View</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block ring-2 ring-rose-300 dark:ring-rose-900" /> Trauma L1
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block ring-2 ring-blue-300 dark:ring-blue-900" /> Hospital
              </span>
            </div>
          </div>

          <div
            id="osm-facilities-map"
            ref={mapContainerRef}
            className="w-full h-80 sm:h-96 z-10"
            style={{ minHeight: '340px' }}
          />

          {/* Quick directions bar for selected facility */}
          {selectedFacility && (
            <div className="p-4 sm:p-4.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>{selectedFacility.name}</span>
                  <span className="text-[10px] font-black uppercase bg-rose-600 text-white px-2 py-0.5 rounded-md">
                    {selectedFacility.traumaLevel}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5 font-medium">
                  {selectedFacility.distanceMiles} miles away • Est. {selectedFacility.estimatedWaitMinutes} min wait • {selectedFacility.icuBedsAvailable} ICU beds
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </a>
                <a
                  href={`tel:${selectedFacility.emergencyPhone}`}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Hospital</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Facilities List & Detail Cards */}
        <div className="lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1">
          {facilities.map((fac) => {
            const isSelected = selectedFacility?.id === fac.id;
            return (
              <div
                key={fac.id}
                onClick={() => handleSelectFacility(fac)}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-500 dark:border-rose-600 shadow-md ring-1 ring-rose-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        fac.traumaLevel === 'Level I'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                          : fac.traumaLevel === 'Level II'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                      }`}
                    >
                      {fac.traumaLevel}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {fac.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                      {fac.distanceMiles} mi
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      ({fac.distanceKm} km)
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{fac.address}</span>
                </p>

                {/* Key Metrics: Wait Time, ICU Beds, Open Status */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Wait Time:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" /> ~{fac.estimatedWaitMinutes}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Status:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{fac.openStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">ICU Capacity:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                      <Bed className="w-3 h-3 text-indigo-500" /> {fac.icuBedsAvailable} beds
                    </span>
                  </div>
                </div>

                {/* Available Specialized Services */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {fac.services.slice(0, 3).map((svc, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                    >
                      {svc}
                    </span>
                  ))}
                  {fac.services.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">
                      +{fac.services.length - 3} more
                    </span>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`tel:${fac.emergencyPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Call ({fac.emergencyPhone.split('/')[0].trim()})</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
