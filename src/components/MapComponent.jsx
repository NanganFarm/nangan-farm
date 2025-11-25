import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ zones, onZoneCreated, onZoneDeleted }) => {
    // Default center (can be adjusted or dynamic based on user location)
    const defaultCenter = [10.7, 122.9]; // Approx Negros/Panay area (sugar land) or just generic
    const zoom = 13;

    const _onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const latlngs = layer.getLatLngs()[0]; // Get array of LatLng objects
            const coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
            onZoneCreated(coordinates);
        }
    };

    const _onDeleted = (e) => {
        // Handle deletion if needed
    };

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 z-0 relative">
            <MapContainer center={defaultCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    opacity={0.3} // Overlay labels/roads slightly
                />

                <FeatureGroup>
                    <EditControl
                        position="topright"
                        onCreated={_onCreated}
                        onDeleted={_onDeleted}
                        draw={{
                            rectangle: false,
                            circle: false,
                            circlemarker: false,
                            marker: false,
                            polyline: false,
                            polygon: {
                                allowIntersection: false,
                                drawError: {
                                    color: '#e1e100',
                                    message: '<strong>Oh snap!<strong> you can\'t draw that!'
                                },
                                shapeOptions: {
                                    color: '#10b981' // Emerald-500
                                }
                            }
                        }}
                    />
                </FeatureGroup>

                {zones.map(zone => {
                    if (!zone.coordinates) return null;
                    let parsedCoords;
                    try {
                        parsedCoords = typeof zone.coordinates === 'string'
                            ? JSON.parse(zone.coordinates)
                            : zone.coordinates;
                    } catch (e) {
                        console.error("Invalid coordinates for zone", zone.name, e);
                        return null;
                    }

                    return (
                        <Polygon
                            key={zone.id}
                            positions={parsedCoords}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4 }}
                        >
                            <Popup>
                                <div className="text-center">
                                    <h3 className="font-bold">{zone.name}</h3>
                                    <p>{zone.area} {typeof zone.area === 'number' ? 'ha' : ''}</p>
                                    <p className="text-xs text-gray-500">{zone.crop}</p>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
