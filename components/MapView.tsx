import React, { useState, useEffect, useRef } from 'react';
import type { Shop } from '../types';

// --- Google Maps Loader Hook ---
const useGoogleMapsScript = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!process.env.API_KEY) {
      console.error("Google Maps API key is not defined in process.env.");
      return;
    }
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
        // Script already requested, wait for it to load
        const check = setInterval(() => {
            if (window.google && window.google.maps) {
                setIsLoaded(true);
                clearInterval(check);
            }
        }, 100);
        return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Failed to load Google Maps script.");
    document.head.appendChild(script);

  }, []);
  return isLoaded;
};

// --- MapView Component ---
interface MapViewProps {
  shops: Shop[];
  onSelectShop: (id: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ shops, onSelectShop }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const isMapsLoaded = useGoogleMapsScript();
  const mapInstance = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (isMapsLoaded && mapRef.current) {
        if (!mapInstance.current) {
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: 45.0703, lng: 7.6869 }, // Center on Turin
                zoom: 13,
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
                    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
                    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
                    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
                    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
                ]
            });
        }
        
        const map = mapInstance.current;
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        shops.forEach(shop => {
            if (!shop.lat || !shop.lng) return;
            const marker = new window.google.maps.Marker({
                position: { lat: shop.lat, lng: shop.lng },
                map: map,
                title: shop.name,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#F97316',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2,
                }
            });

            const infoWindow = new window.google.maps.InfoWindow({
                 content: `
                  <div style="font-family: Inter, sans-serif; padding: 4px;">
                    <h3 style="font-weight: 600; font-size: 16px; margin:0 0 4px 0;">${shop.name}</h3>
                    <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">${shop.category}</p>
                    <button id="shop-${shop.id}" style="background-color: #F97316; color: white; border: none; padding: 6px 12px; font-size: 12px; font-weight: 500; border-radius: 999px; cursor: pointer;">Vedi Dettagli</button>
                  </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
                window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                    document.getElementById(`shop-${shop.id}`)?.addEventListener('click', () => onSelectShop(shop.id));
                });
            });

            markersRef.current.push(marker);
        });
    }
  }, [isMapsLoaded, shops, onSelectShop]);

  if (!isMapsLoaded) return <div className="flex-grow flex items-center justify-center"><p>Caricamento mappa...</p></div>;

  return <div ref={mapRef} className="flex-grow w-full h-full" style={{minHeight: 'calc(100vh - 200px)'}} />;
};

export default MapView;
