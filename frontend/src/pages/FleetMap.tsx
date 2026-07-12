import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Truck, MapPin, Loader2, Info } from 'lucide-react';

declare const L: any; // Leaflet global loaded via script in index.html

const CITY_COORDINATES: Record<string, [number, number]> = {
  'New York': [40.7128, -74.0060],
  'Chicago': [41.8781, -87.6298],
  'Los Angeles': [34.0522, -118.2437],
  'Houston': [29.7604, -95.3698],
  'San Francisco': [37.7749, -122.4194],
  'Miami': [25.7617, -80.1918],
  'Boston': [42.3601, -71.0589],
  'Dallas': [32.7767, -96.7970],
  'Phoenix': [33.4484, -112.0740],
  'Seattle': [47.6062, -122.3321],
  'Denver': [39.7392, -104.9903],
  'Atlanta': [33.7490, -84.3880],
};

const getCoordinates = (name: string): [number, number] => {
  if (!name) return [39.8283, -98.5795]; // Center of US
  const clean = name.split(',')[0].trim();
  if (CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];
  
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 34 + (Math.abs(hash % 100) / 100) * 12;
  const lng = -118 + (Math.abs((hash >> 8) % 100) / 100) * 45;
  return [lat, lng];
};

export function FleetMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Fetch vehicles and active trips
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles'),
  });

  const { data: tripsData, isLoading: loadingTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.get('/trips'),
  });

  const vehicles = vehiclesData?.success ? vehiclesData.vehicles : [];
  const trips = tripsData?.success ? tripsData.trips : [];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize Leaflet map
    mapRef.current = L.map(mapContainerRef.current).setView([39.8283, -98.5795], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear previous markers & polylines
    markersLayerRef.current.clearLayers();

    const bounds: any[] = [];

    // 1. Process active trips for path lines and active vehicle locations
    const activeTrips = trips.filter((t: any) => t.status === 'DISPATCHED');
    const onTripVehicleIds = new Set(activeTrips.map((t: any) => t.vehicleId));

    activeTrips.forEach((trip: any) => {
      const sourceCoord = getCoordinates(trip.startLocation);
      const destCoord = getCoordinates(trip.endLocation);

      bounds.push(sourceCoord, destCoord);

      // Create animated route line (subtle dash pattern)
      const routeLine = L.polyline([sourceCoord, destCoord], {
        color: '#0F766E', // Deep Emerald
        weight: 3,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(markersLayerRef.current);

      routeLine.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <p class="font-bold text-zinc-900">${trip.tripNumber}</p>
          <p class="text-zinc-500">Route: ${trip.startLocation} ➔ ${trip.endLocation}</p>
          <p class="text-zinc-500">Operator: ${trip.driver?.fullName || 'N/A'}</p>
        </div>
      `);

      // Vehicle location (interpolated midpoint)
      const midLat = (sourceCoord[0] + destCoord[0]) / 2;
      const midLng = (sourceCoord[1] + destCoord[1]) / 2;

      const vehicleMarker = L.circleMarker([midLat, midLng], {
        radius: 8,
        fillColor: '#0F766E', // Deep Emerald for active route
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(markersLayerRef.current);

      vehicleMarker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <p class="font-bold text-zinc-900">Vehicle: ${trip.vehicle?.plateNumber}</p>
          <p class="text-zinc-500">${trip.vehicle?.make} ${trip.vehicle?.model}</p>
          <span class="px-2 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 rounded-full">On Trip</span>
        </div>
      `);
    });

    // 2. Render remaining vehicles (Available, Maintenance, Alerts)
    vehicles.forEach((v: any) => {
      if (onTripVehicleIds.has(v.id)) return; // Already rendered on route

      // Fallback coordinate mapping (available vehicles at last destination or Chicago)
      const lastTrip = trips.find((t: any) => t.vehicleId === v.id);
      const city = lastTrip ? lastTrip.endLocation : 'Chicago'; 
      const coord = getCoordinates(city);
      
      bounds.push(coord);

      let color = '#10b981'; // Green for Available
      let statusLabel = 'Available';
      let badgeStyle = 'bg-emerald-50 text-emerald-700';

      if (v.status === 'MAINTENANCE') {
        color = '#f59e0b'; // Orange
        statusLabel = 'In Maintenance';
        badgeStyle = 'bg-amber-50 text-amber-700';
      } else if (v.status === 'OUT_OF_SERVICE') {
        color = '#ef4444'; // Red
        statusLabel = 'Critical Alert';
        badgeStyle = 'bg-rose-50 text-rose-700';
      } else if (v.status === 'RETIRED') {
        color = '#71717a'; // Gray
        statusLabel = 'Retired';
        badgeStyle = 'bg-zinc-100 text-zinc-700';
      }

      const marker = L.circleMarker(coord, {
        radius: 8,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(markersLayerRef.current);

      marker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <p class="font-bold text-zinc-900">${v.plateNumber}</p>
          <p class="text-zinc-500">${v.make} ${v.model}</p>
          <span class="px-2 py-0.5 text-[10px] font-semibold ${badgeStyle} rounded-full">${statusLabel}</span>
        </div>
      `);
    });

    // Auto zoom to encompass all coordinates
    if (bounds.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [vehicles, trips]);

  const isLoading = loadingVehicles || loadingTrips;

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Operations Map</h1>
        <p className="text-sm text-zinc-450 dark:text-zinc-455 mt-0.5">
          Real-time geospatial tracking of fleet units and active routes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left side list panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between h-[600px] card-hover">
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <h3 className="text-xs font-bold text-zinc-705 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2.5">
              <Truck className="w-4 h-4 text-zinc-400" /> Active Fleet Assets
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12 text-zinc-450 text-xs font-semibold">
                No fleet vehicles registered.
              </div>
            ) : (
              <div className="space-y-1.5">
                {vehicles.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVehicle(v);
                      const lastTrip = trips.find((t: any) => t.vehicleId === v.id);
                      const city = lastTrip ? lastTrip.endLocation : 'Chicago';
                      const coord = getCoordinates(city);
                      if (mapRef.current) {
                        mapRef.current.setView(coord, 8);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between items-center cursor-pointer ${
                      selectedVehicle?.id === v.id
                        ? 'border-[#0F766E] bg-teal-50/10'
                        : 'border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-zinc-705 dark:text-zinc-50">{v.plateNumber}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">{v.make} {v.model}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                      v.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                        : v.status === 'ON_TRIP'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400'
                        : v.status === 'MAINTENANCE'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                    }`}>
                      {v.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-450 space-y-2 font-semibold">
            <p className="font-bold text-zinc-705 dark:text-zinc-200">Legend Map Colors:</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Available / Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
              <span>On Active Route (Dash line)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Workshop / Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Critical Warning / Out of Service</span>
            </div>
          </div>
        </div>

        {/* Right side map wrapper */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden h-[600px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FleetMap;
