import { supabase } from '../supabaseClient';

const API_KEY = import.meta.env.VITE_AGROMONITORING_API_KEY;
const BASE_URL = 'https://api.agromonitoring.com/agro/1.0';

export const ndviApi = {
    /**
     * Create a polygon on Agromonitoring.com
     * @param {string} name - Name of the zone
     * @param {Array} coordinates - Array of [lat, lng] arrays. 
     * Note: Agromonitoring expects [lng, lat] and the first point must equal the last point (closed loop).
     */
    async createPolygon(name, coordinates) {
        if (!API_KEY) {
            console.warn("NDVI API: No API Key provided.");
            return null;
        }

        // Convert [lat, lng] from Leaflet to [lng, lat] for GeoJSON
        // Also ensure it is closed (first point = last point)
        const geoJsonCoords = coordinates.map(coord => [coord[1], coord[0]]);
        if (geoJsonCoords.length > 0) {
            const first = geoJsonCoords[0];
            const last = geoJsonCoords[geoJsonCoords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                geoJsonCoords.push(first);
            }
        }

        const payload = {
            name: name,
            geo_json: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [geoJsonCoords]
                }
            }
        };

        try {
            const response = await fetch(`${BASE_URL}/polygons?appid=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("NDVI API: Failed to create polygon", error);
                throw new Error(`Failed to create polygon: ${error.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error("NDVI API Error:", error);
            throw error;
        }
    },

    /**
     * Search for available satellite imagery for a polygon
     * @param {string} polygonId 
     * @param {Date} startDate 
     * @param {Date} endDate 
     */
    async searchSatelliteImages(polygonId, startDate, endDate) {
        if (!API_KEY || !polygonId) return [];

        const start = Math.floor(startDate.getTime() / 1000);
        const end = Math.floor(endDate.getTime() / 1000);

        try {
            // searching for Sentinel-2 data (highest resolution free)
            const url = `${BASE_URL}/image/search?start=${start}&end=${end}&polyid=${polygonId}&appid=${API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to search images");
            }

            const data = await response.json();
            // Filter to ensure we have stats or logic to determine best images (low cloud coverage)
            // The API returns coverage, sun zenith, etc.
            // Let's sort by cloud coverage (cl) ascending
            return data.sort((a, b) => (a.cl || 100) - (b.cl || 100));
        } catch (error) {
            console.error("NDVI API Search Error:", error);
            return [];
        }
    },

    /**
     * Get NDVI statistics for a specific polygon and time range
     * Note: Agromonitoring has a 'stats' endpoint or we can deduce from images.
     * The simplest 'history' endpoint might be best.
     */
    async getNDVIHistory(polygonId, startDate, endDate) {
        if (!API_KEY || !polygonId) return [];

        const start = Math.floor(startDate.getTime() / 1000);
        const end = Math.floor(endDate.getTime() / 1000);

        try {
            const url = `${BASE_URL}/ndvi/history?start=${start}&end=${end}&polyid=${polygonId}&appid=${API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch NDVI history");
            }

            const data = await response.json();
            // Data format is usually array of observations
            return data.map(item => ({
                dt: item.dt,
                date: new Date(item.dt * 1000),
                min: item.data.min,
                max: item.data.max,
                mean: item.data.mean,
                median: item.data.median,
                p25: item.data.p25,
                p75: item.data.p75
            })).sort((a, b) => a.dt - b.dt);
        } catch (error) {
            console.error("NDVI History Error:", error);
            return []; // Fail gracefully
        }
    },

    /**
     * Get the tile URL for a specific image
     * @param {object} imageObject - One item from searchSatelliteImages result
     */
    getTileUrl(imageObject) {
        // Construct the tile URL for the NDVI layer
        // Format: {t}/{z}/{x}/{y} 
        // But Agromonitoring returns a direct tile URL template or we use the image ID
        // Actually, for a specific image, we can use their tile service.
        // URL format: https://api.agromonitoring.com/agro/1.0/image/{z}/{x}/{y}?id={image_id}&appid={API_KEY}

        if (!imageObject || !imageObject.id) return null;
        return `${BASE_URL}/image/{z}/{x}/{y}?id=${imageObject.id}&appid=${API_KEY}&paletteid=1`; // paletteid=1 is usually NDVI standard
    }
};
