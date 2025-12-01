import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, Wind, Droplets, MapPin } from 'lucide-react';

export const WeatherWidget = ({ coordinates, farmName }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationName, setLocationName] = useState(farmName || "Local Farm");
    const [displayCoords, setDisplayCoords] = useState(null);

    // Default to a central location in the Philippines (e.g., Negros Occidental for sugar) if no geolocation
    // Bacolod coordinates: 10.6765, 122.9509
    const [coords, setCoords] = useState({ lat: 10.6765, long: 122.9509 });

    useEffect(() => {
        if (coordinates) {
            setCoords(coordinates);
            setDisplayCoords(coordinates);
            // If coordinates are provided, try to reverse geocode
            fetchLocationName(coordinates.lat, coordinates.long);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newCoords = {
                        lat: position.coords.latitude,
                        long: position.coords.longitude
                    };
                    setCoords(newCoords);
                    setDisplayCoords(newCoords);
                    setLocationName("Current Location");
                    // Optional: Reverse geocode current location too if desired
                    // fetchLocationName(newCoords.lat, newCoords.long);
                },
                (err) => {
                    console.log("Geolocation denied or error, using default.", err);
                }
            );
        }
    }, [coordinates]);

    const fetchLocationName = async (lat, lon) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (response.ok) {
                const data = await response.json();
                // Construct a friendly name: City/Town, Province/Country
                const address = data.address;
                const city = address.city || address.town || address.village || address.municipality;
                const state = address.state || address.region || address.country;

                if (city) {
                    setLocationName(`${city}, ${state}`);
                } else {
                    // Fallback to coordinates if name not found
                    setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                }
            } else {
                setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            // Fallback to coordinates
            setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
    };

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
                );

                if (!response.ok) throw new Error('Weather data fetch failed');

                const data = await response.json();
                setWeather(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [coords]);

    const getWeatherIcon = (code) => {
        // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
        if (code === 0) return <Sun className="text-yellow-500" />;
        if (code >= 1 && code <= 3) return <Cloud className="text-gray-400" />;
        if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" />; // Drizzle/Rain
        if (code >= 80 && code <= 82) return <CloudRain className="text-blue-600" />; // Showers
        if (code >= 95) return <Wind className="text-purple-500" />; // Thunderstorm
        return <Cloud className="text-gray-400" />;
    };

    const getWeatherDescription = (code) => {
        if (code === 0) return "Clear Sky";
        if (code >= 1 && code <= 3) return "Partly Cloudy";
        if (code >= 51 && code <= 67) return "Rainy";
        if (code >= 80 && code <= 82) return "Showers";
        if (code >= 95) return "Thunderstorm";
        return "Overcast";
    };

    if (loading) return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse h-48">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
    );

    if (error) return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-red-500">
            Weather unavailable
        </div>
    );

    const current = weather.current;
    const daily = weather.daily;

    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 text-blue-100 mb-1">
                        <MapPin size={16} />
                        <span className="text-sm font-medium">{locationName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-5xl font-bold">{Math.round(current.temperature_2m)}°</span>
                        <div>
                            <div className="text-lg font-semibold">{getWeatherDescription(current.weather_code)}</div>
                            <div className="text-blue-100 text-sm">
                                H: {Math.round(daily.temperature_2m_max[0])}° L: {Math.round(daily.temperature_2m_min[0])}°
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                    {getWeatherIcon(current.weather_code)}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                        <Wind size={14} /> Wind
                    </div>
                    <div className="font-semibold">{current.wind_speed_10m} km/h</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                        <Droplets size={14} /> Humidity
                    </div>
                    <div className="font-semibold">{current.relative_humidity_2m}%</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                        <CloudRain size={14} /> Rain
                    </div>
                    <div className="font-semibold">{current.precipitation} mm</div>
                </div>
            </div>

            <div className="border-t border-white/20 pt-4">
                <div className="grid grid-cols-5 gap-2 text-center">
                    {daily.time.slice(1, 6).map((date, i) => (
                        <div key={date} className="flex flex-col items-center gap-1">
                            <span className="text-xs text-blue-100">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <div className="my-1 scale-75">
                                {getWeatherIcon(daily.weather_code[i + 1])}
                            </div>
                            <span className="text-sm font-medium">
                                {Math.round(daily.temperature_2m_max[i + 1])}°
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
