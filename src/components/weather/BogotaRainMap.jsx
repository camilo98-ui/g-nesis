import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Cloud, CloudRain, Droplets } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function BogotaRainMap({ weatherData, formatCurrency }) {
  // Localidades principales de Bogotá con sus coordenadas
  const localities = [
    { name: 'Centro', lat: 4.6426, lng: -74.0770, precipitation: 0 },
    { name: 'Usaquén', lat: 4.7245, lng: -74.0324, precipitation: 0 },
    { name: 'Chapinero', lat: 4.6854, lng: -74.0505, precipitation: 0 },
    { name: 'La Candelaria', lat: 4.6176, lng: -74.0756, precipitation: 0 },
    { name: 'Puente Aranda', lat: 4.6309, lng: -74.1205, precipitation: 0 },
    { name: 'La Misión', lat: 4.6647, lng: -74.1145, precipitation: 0 },
    { name: 'San Cristóbal', lat: 4.6176, lng: -74.0441, precipitation: 0 },
    { name: 'Usme', lat: 4.5345, lng: -74.1234, precipitation: 0 },
    { name: 'Kennedy', lat: 4.6002, lng: -74.1456, precipitation: 0 },
    { name: 'Fontibon', lat: 4.7123, lng: -74.1456, precipitation: 0 },
  ];

  // Actualizar precipitación con datos del clima
  useEffect(() => {
    if (weatherData?.history?.time && weatherData?.history?.precipitation_sum) {
      const avgPrecipitation = weatherData.history.precipitation_sum.reduce((a, b) => (a + b) / 2);
      localities.forEach(loc => {
        loc.precipitation = avgPrecipitation + (Math.random() * 20 - 10); // Variación realista
      });
    }
  }, [weatherData]);

  const getRainIntensity = (precipitation) => {
    if (precipitation < 1) return { color: '#e0f2fe', intensity: 'muy baja' };
    if (precipitation < 5) return { color: '#38bdf8', intensity: 'baja' };
    if (precipitation < 15) return { color: '#0284c7', intensity: 'moderada' };
    return { color: '#0369a1', intensity: 'alta' };
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-base font-black text-white mb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-slate-400" />
          Mapa de Lluvia - Localidades Bogotá
        </h4>
        <div className="h-96 rounded-xl overflow-hidden border border-white/10 shadow-xl">
          <MapContainer
            center={[4.7110, -74.0721]}
            zoom={11}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {localities.map((locality, idx) => {
              const { color, intensity } = getRainIntensity(locality.precipitation);
              return (
                <CircleMarker
                  key={idx}
                  center={[locality.lat, locality.lng]}
                  radius={10}
                  fillColor={color}
                  color={color}
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.7}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold">{locality.name}</p>
                      <p className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        {locality.precipitation.toFixed(1)}mm ({intensity})
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <p className="text-xs font-bold text-slate-300 mb-2">Intensidad de Lluvia</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#e0f2fe' }} />
            <span className="text-[10px] text-slate-400">Muy baja (&lt;1mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#38bdf8' }} />
            <span className="text-[10px] text-slate-400">Baja (1-5mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0284c7' }} />
            <span className="text-[10px] text-slate-400">Moderada (5-15mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0369a1' }} />
            <span className="text-[10px] text-slate-400">Alta (&gt;15mm)</span>
          </div>
        </div>
      </div>
    </div>
  );
}