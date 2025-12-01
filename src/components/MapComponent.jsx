import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup, Popup, useMap, useMapEvents, Marker, Tooltip } from 'react-leaflet';
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

// Component to handle map center updates
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

// Component to handle map clicks for location selection
const LocationSelector = ({ isSelecting, onSelect }) => {
    useMapEvents({
        click(e) {
            if (isSelecting && onSelect) {
                onSelect([e.latlng.lat, e.latlng.lng]);
            }
        },
    });
    return null;
};

const MapComponent = ({
    zones,
    onZoneCreated,
    onZoneDeleted,
    center,
    zoom = 16, // Increased default zoom
    isSelectingLocation = false,
    onLocationSelect,
    farmLocation
}) => {
    // Default center (can be adjusted or dynamic based on user location)
    const defaultCenter = [10.7, 122.9]; // Approx Negros/Panay area (sugar land)

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
        <div className={`h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 z-0 relative ${isSelectingLocation ? 'cursor-crosshair ring-4 ring-emerald-500/50' : ''}`}>
            {isSelectingLocation && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg font-bold animate-pulse pointer-events-none">
                    Click on the map to set Farm Location
                </div>
            )}

            <MapContainer center={center || defaultCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <MapController center={center} zoom={zoom} />
                <LocationSelector isSelecting={isSelectingLocation} onSelect={onLocationSelect} />

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

                {/* Farm Location Marker */}
                {farmLocation && (
                    <Marker position={farmLocation}>
                        <Popup>
                            <div className="text-center font-bold">Farm Center</div>
                        </Popup>
                    </Marker>
                )}

                {zones.map(zone => {
                    if (!zone.coordinates) return null;
                    let parsedCoords;
                    try {
                        parsedCoords = typeof zone.coordinates === 'string'
                            ? JSON.parse(zone.coordinates)
                            : zone.coordinates;

                        // Handle double-stringified case
                        if (typeof parsedCoords === 'string') {
                            parsedCoords = JSON.parse(parsedCoords);
                        }
                    } catch (e) {
                        console.error("Invalid coordinates for zone", zone.name, e);
                        return null;
                    }

                    // Ensure it is an array
                    if (!Array.isArray(parsedCoords)) {
                        console.warn("Coordinates is not an array for zone", zone.name, parsedCoords);
                        return null;
                    }

                    // Filter out any null/undefined/invalid points
                    const isNested = parsedCoords.length > 0 && Array.isArray(parsedCoords[0]) && Array.isArray(parsedCoords[0][0]);
                    let validCoords = parsedCoords;

                    if (!isNested) {
                        validCoords = parsedCoords.filter(pt => Array.isArray(pt) && pt.length >= 2 && pt[0] != null && pt[1] != null);
                        if (validCoords.length < 3) {
                            console.warn("Not enough valid points for zone", zone.name);
                            return null;
                        }
                    } else {
                        if (parsedCoords.length === 0 || !parsedCoords[0]) return null;
                    }

                    return (
                        <Polygon
                            key={zone.id}
                            positions={validCoords}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4 }}
                        >
                            <Tooltip
                                permanent
                                direction="center"
                                className="!bg-white/90 !backdrop-blur-sm !text-emerald-900 !px-4 !py-1 !rounded-full !shadow-xl !border-0 !font-bold !text-sm !tracking-wide"
                                opacity={1}
                            >
                                {zone.name}
                            </Tooltip>
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
