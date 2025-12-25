import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import { DollarSign, CheckCircle2, Circle, ChevronLeft, ChevronRight, Sprout, ArrowLeft, Map as MapIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import clsx from 'clsx';
import { Modal } from '../components/Modal';
import { WeatherWidget } from '../components/WeatherWidget';
import MapComponent from '../components/MapComponent';
import { ndviApi } from '../services/ndviApi';
import NDVIChart from '../components/NDVIChart';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card flex items-start justify-between group hover:shadow-md transition-all duration-200">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

const ProgressBar = ({ stages, currentStageId, onStageClick }) => {
    const currentIndex = stages.findIndex(s => s.id === currentStageId);

    return (
        <div className="card mb-8">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sprout size={20} className="text-primary-500" />
                Crop Progress
            </h3>
            <div className="w-full">
                <div className="relative flex items-center justify-between px-2 md:px-10 z-0 w-full">
                    {/* Progress Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-700 z-0 pointer-events-none rounded-full"></div>
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary-500 to-accent-500 z-0 transition-all duration-1000 ease-out pointer-events-none rounded-full"
                        style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                    ></div>

                    {stages.map((stage, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = stage.id === currentStageId;

                        return (
                            <div
                                key={stage.id}
                                className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                                onClick={() => {
                                    console.log('Stage div clicked:', stage.id);
                                    onStageClick(stage);
                                }}
                            >
                                <div className={clsx(
                                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-sm",
                                    isCompleted ? "bg-primary-500 border-primary-500 text-white" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600",
                                    isCurrent && "ring-4 ring-accent-200 dark:ring-accent-900 scale-110 border-accent-500 bg-accent-500 text-primary-900"
                                )}>
                                    {isCompleted && !isCurrent ? <CheckCircle2 size={16} className="md:w-5 md:h-5" /> : <Circle size={16} className="md:w-5 md:h-5" />}
                                </div>
                                <span className={clsx(
                                    "text-[10px] md:text-xs font-bold transition-all absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full",
                                    isCurrent ? "bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300" : (isCompleted ? "text-primary-700 dark:text-primary-400" : "text-gray-400 dark:text-gray-500")
                                )}>
                                    {stage.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="h-8"></div> {/* Spacer for labels */}
        </div>
    );
};

const Calendar = ({ expenses }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getDayExpenses = (day) => {
        return expenses.filter(e => isSameDay(parseISO(e.date), day));
    };

    return (
        <div className="card h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-lg text-primary-600 dark:text-primary-400">
                        <MapIcon size={18} />
                    </span>
                    Event Calendar
                </h3>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-primary-600 transition-all shadow-sm">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 min-w-[100px] text-center text-sm">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-primary-600 transition-all shadow-sm">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] uppercase tracking-wider font-bold text-gray-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                    const dayExpenses = getDayExpenses(day);
                    const hasEvents = dayExpenses.length > 0;

                    return (
                        <div
                            key={day.toString()}
                            className={clsx(
                                "aspect-square rounded-xl border p-1 flex flex-col items-center justify-start relative transition-all duration-200 cursor-pointer min-h-[50px] group",
                                isToday(day) ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 shadow-inner" : "border-gray-50 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-sm",
                                hasEvents && !isToday(day) && "bg-gray-50 dark:bg-gray-800/50"
                            )}
                            title={dayExpenses.map(e => `${e.description || e.category}: ₱${Number(e.amount).toLocaleString()}`).join('\n')}
                        >
                            <span className={clsx(
                                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                                isToday(day) ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700"
                            )}>
                                {format(day, 'd')}
                            </span>
                            {hasEvents && (
                                <div className="flex gap-0.5 flex-wrap justify-center content-start w-full px-1">
                                    {dayExpenses.slice(0, 4).map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-500 shadow-sm" />
                                    ))}
                                    {dayExpenses.length > 4 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const { currentFarm, currentCycle, currentZone, updateCycleStage, enterZone, exitZone } = useFarm();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [zones, setZones] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isEndCycleModalOpen, setIsEndCycleModalOpen] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [targetStage, setTargetStage] = useState(null);

    // NDVI State
    const [ndviData, setNdviData] = useState([]);
    const [ndviLoading, setNdviLoading] = useState(false);
    const [ndviError, setNdviError] = useState(null);
    const [overlayUrl, setOverlayUrl] = useState(null);
    const [availableImages, setAvailableImages] = useState([]);

    // Fetch NDVI Data when Zone is selected
    useEffect(() => {
        if (currentZone && currentFarm) {
            fetchNdviData();
        } else {
            setNdviData([]);
            setOverlayUrl(null);
            setNdviError(null);
        }
    }, [currentZone, currentFarm]);

    const fetchNdviData = async () => {
        if (!currentZone) return;
        setNdviLoading(true);
        setNdviError(null);

        try {
            // 1. Check if zone has agromonitoring_id
            let polyId = currentZone.agromonitoringId;

            // 2. If not, try to create it (or find it - strict create for now)
            if (!polyId && currentZone.coordinates) {
                console.log("Creating polygon for NDVI tracking...", currentZone.name);
                let coords = typeof currentZone.coordinates === 'string' ? JSON.parse(currentZone.coordinates) : currentZone.coordinates;
                // Handle Leaflet L.LatLng object or array
                // The API service expects [[lat, lng], ...]
                // Ensure coords is a flat array of points
                if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
                    // Valid
                } else {
                    console.warn("Invalid coordinates for NDVI", coords);
                    setNdviError("Invalid zone coordinates. Please edit and re-save the zone.");
                    setNdviLoading(false);
                    return;
                }

                try {
                    polyId = await ndviApi.createPolygon(currentZone.name, coords);
                    if (polyId) {
                        // Save it back to our DB
                        try {
                            await api.updateZone(currentZone.id, { agromonitoringId: polyId });
                        } catch (dbError) {
                            console.error("Failed to update zone with polygon ID", dbError);
                            setNdviError("Database Error: Is 'agromonitoring_id' column missing? Please run migration.");
                            throw dbError; // rethrow to stop execution
                        }
                    }
                } catch (e) {
                    console.error("Failed to create polygon:", e);
                    if (!ndviError) setNdviError("Failed to register zone with satellite service.");
                    throw e;
                }
            }

            if (polyId) {
                // CLOCK SKEW WORKAROUND:
                // The API hangs if we request data for 2025 (Future). 
                // If system time is > 2024, clamp "now" to a safe recent date (e.g. late 2024).
                let now = new Date();
                const realLinkYear = 2024; // Assuming this is the real current year
                if (now.getFullYear() > realLinkYear) {
                    console.warn(`System time (${now.getFullYear()}) is in the future relative to API. Clamping to end of ${realLinkYear}.`);
                    now = new Date(`${realLinkYear}-12-08T12:00:00Z`); // Use a safe recent date
                }

                const sixMonthsAgo = subMonths(now, 6);

                // Fetch History
                try {
                    const history = await ndviApi.getNDVIHistory(polyId, sixMonthsAgo, now);
                    setNdviData(history);
                } catch (e) {
                    console.error("Failed to fetch history", e);
                    // Don't error the whole widget if just history fails, but maybe warn?
                    setNdviError("Could not fetch NDVI history.");
                }

                // Fetch Images (for overlay)
                try {
                    const images = await ndviApi.searchSatelliteImages(polyId, sixMonthsAgo, now);
                    setAvailableImages(images);

                    // Set default overlay to most recent low-cloud image
                    const bestImage = images.find(img => (img.cl || 100) < 20); // < 20% clouds
                    if (bestImage) {
                        const tileUrl = ndviApi.getTileUrl(bestImage);
                        setOverlayUrl(tileUrl);
                    }
                } catch (e) {
                    console.warn("Failed to fetch images", e);
                }
            } else {
                // If we couldn't get a polyId and didn't error before
                if (!ndviError && currentZone.coordinates) {
                    setNdviError("Could not link zone to satellite data.");
                }
            }

        } catch (error) {
            console.error("NDVI Fetch Error:", error);
            // Error is already set above in most cases, or we set generic here
            if (!ndviError) setNdviError(error.message || "Unknown error loading satellite data.");
        } finally {
            setNdviLoading(false);
        }
    };

    useEffect(() => {
        if (currentFarm) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [currentFarm, currentCycle, currentZone]);

    const loadData = async () => {
        console.log("Dashboard loading data. Farm:", currentFarm);
        setLoading(true);
        try {
            // Load Stages
            let stageData = [];
            try {
                stageData = await api.getStages();
                console.log("Loaded stages:", stageData.length);
            } catch (e) {
                console.error("Failed to load stages:", e);
            }

            // Load Zones
            let zoneData = [];
            try {
                zoneData = await api.getZones(currentFarm.id);
                console.log("Loaded zones:", zoneData.length);
            } catch (e) {
                console.error("Failed to load zones:", e);
            }

            // Load Cycles
            let cycleData = [];
            try {
                cycleData = await api.getCycles(currentFarm.id);
                console.log("Loaded cycles:", cycleData.length);
            } catch (e) {
                console.error("Failed to load cycles:", e);
            }

            // Ensure stages are sorted by order
            const sortedStages = stageData.sort((a, b) => a.order - b.order);
            setStages(sortedStages);
            setZones(zoneData);
            setCycles(cycleData);

            // Fetch expenses based on view
            let expenseData = [];
            try {
                expenseData = currentCycle
                    ? await api.getExpenses(currentFarm.id, currentCycle.id)
                    : await api.getExpenses(currentFarm.id);
                console.log("Loaded expenses:", expenseData.length);
            } catch (e) {
                console.error("Failed to load expenses:", e);
            }

            // If not in a specific cycle view (Farm View or Zone View)
            if (!currentCycle) {
                // 1. Filter out expenses from COMPLETED cycles (keep active and general)
                const completedCycleIds = cycleData.filter(c => c.status === 'completed').map(c => c.id);
                expenseData = expenseData.filter(e => !e.cycleId || !completedCycleIds.includes(e.cycleId));

                // 2. If in Zone View, further filter by zone
                if (currentZone) {
                    const zoneCycleIds = cycleData.filter(c => c.zoneId === currentZone.id).map(c => c.id);
                    expenseData = expenseData.filter(e =>
                        e.zoneId === currentZone.id || (e.cycleId && zoneCycleIds.includes(e.cycleId))
                    );
                }
            }

            setExpenses(expenseData);

            // Auto-repair: Check if currentCycle has a valid stage
            if (currentCycle && sortedStages.length > 0) {
                const currentStageValid = sortedStages.find(s => s.id === currentCycle.currentStageId);
                if (!currentStageValid) {
                    console.warn("Current cycle has invalid stage ID. Auto-repairing to first stage...");
                    const firstStage = sortedStages[0];
                    // Update via API
                    await api.updateCycle(currentCycle.id, { currentStageId: firstStage.id });
                    // Update local state (though a reload might be safer, let's update local cycle list)
                    // Actually, updateCycleStage in context handles this, but we are in Dashboard.
                    // We can call updateCycleStage from context if we want to sync everything.
                    // But wait, updateCycleStage updates currentCycle in context.
                    // Let's use the context function if available, or just api.
                    // We have updateCycleStage from useFarm().
                    await updateCycleStage(firstStage.id);
                    // Force a re-render or let the context update propagate?
                    // updateCycleStage updates the context state, so it should trigger a re-render of Dashboard
                    // because Dashboard depends on currentCycle from context.
                }
            }

        } catch (error) {
            console.error("Failed to load dashboard data (General Error)", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStageClick = (stage) => {
        if (!currentCycle) return;
        const currentIndex = stages.findIndex(s => s.id === currentCycle.currentStageId);
        const targetIndex = stages.findIndex(s => s.id === stage.id);

        // Allow moving to any future stage
        if (targetIndex > currentIndex) {
            setTargetStage(stage);
            setIsConfirmModalOpen(true);
        }
    };

    const confirmStageUpdate = async () => {
        if (targetStage && currentCycle) {
            await updateCycleStage(targetStage.id);
            setIsConfirmModalOpen(false);
            setTargetStage(null);
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Calculate Zone Totals for Farm View
    const zoneTotals = !currentCycle ? zones.map(zone => {
        // Find cycles belonging to this zone
        const zoneCycleIds = cycles.filter(c => c.zoneId === zone.id).map(c => c.id);
        // Sum expenses for this zone (either direct zoneId match or via cycleId)
        const zoneExpenses = expenses.filter(e =>
            e.zoneId === zone.id || (e.cycleId && zoneCycleIds.includes(e.cycleId))
        );
        const total = zoneExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        return { ...zone, total };
    }) : [];

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    if (!currentFarm) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <div className="bg-primary-50 p-6 rounded-full mb-6 shadow-sm">
                    <DollarSign size={48} className="text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Nangan Farm!</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    It looks like you haven't created any farms yet.
                    Click the <strong>"Add New Farm"</strong> button in the sidebar to get started.
                </p>
            </div>
        );
    }

    if (currentZone && !currentCycle) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <div className="bg-accent-100 p-6 rounded-full mb-6 shadow-sm">
                    <Sprout size={48} className="text-accent-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Cycle</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    This zone currently has no active crop cycle.
                    Start a new cycle to track expenses and progress.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={exitZone}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Overview
                    </button>
                    <button
                        onClick={() => navigate('/cycles')}
                        className="btn btn-primary"
                    >
                        Create New Cycle
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {currentZone && (
                            <button
                                onClick={exitZone}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
                                title="Back to Farm Overview"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentCycle ? `Dashboard: ${currentCycle.name}` : (currentZone ? `Zone: ${currentZone.name}` : currentFarm?.name)}
                        </h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                        {currentCycle
                            ? 'Track your crop progress and expenses.'
                            : 'Aggregated view of all zones and expenses.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {currentCycle && currentCycle.status !== 'completed' && (
                        (() => {
                            const lastStage = stages[stages.length - 1];
                            const isLastStage = lastStage && currentCycle.currentStageId === lastStage.id;

                            if (isLastStage) {
                                return (
                                    <button
                                        onClick={() => setIsEndCycleModalOpen(true)}
                                        className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm hover:shadow-red-500/30"
                                    >
                                        End Cycle
                                    </button>
                                );
                            }
                            return null;
                        })()
                    )}
                </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats, Progress, Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Total Expenses"
                            value={`₱${totalExpenses.toLocaleString()}`}
                            icon={DollarSign}
                            color="bg-primary-500"
                        />
                        <StatCard
                            title={currentCycle ? "Current Stage" : "Active Zones"}
                            value={currentCycle
                                ? (stages.find(s => s.id === currentCycle.currentStageId)?.name || 'Unknown')
                                : zones.length
                            }
                            icon={CheckCircle2}
                            color="bg-accent-500"
                        />
                        <StatCard
                            title={currentCycle ? "Days Active" : "Total Cycles"}
                            value={currentCycle
                                ? Math.ceil((new Date() - new Date(currentCycle.startDate)) / (1000 * 60 * 60 * 24))
                                : cycles.length
                            }
                            icon={Circle}
                            color="bg-blue-500"
                        />
                    </div>

                    {/* Zone Breakdown (Only in Farm View) */}
                    {!currentCycle && zones.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {zoneTotals.map(zone => (
                                <div
                                    key={zone.id}
                                    className="card cursor-pointer hover:border-primary-500 transition-all group"
                                    onDoubleClick={() => enterZone(zone)}
                                    title="Double click to manage zone"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{zone.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{zone.crop} • {zone.area}</p>
                                        </div>
                                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
                                            <MapIcon size={20} />
                                        </div>
                                    </div>
                                    <div className="mt-4 text-2xl font-bold text-primary-700 dark:text-primary-400">
                                        ₱{zone.total.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress Bar (Only in Cycle View) */}
                    {currentCycle && (
                        <ProgressBar
                            stages={stages}
                            currentStageId={currentCycle.currentStageId}
                            onStageClick={handleStageClick}
                        />
                    )}

                    {/* NDVI Growth Tracking */}
                    {currentZone && (
                        <div className="card">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg text-green-600 dark:text-green-400">
                                        <Sprout size={18} />
                                    </span>
                                    Growth Tracking (NDVI)
                                </span>
                                {overlayUrl && (
                                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                                        Satellite Overlay Active
                                    </span>
                                )}
                            </h3>
                            <div className="h-72">
                                <NDVIChart data={ndviData} isLoading={ndviLoading} error={ndviError} />
                            </div>
                            <p className="text-xs text-center text-gray-400 mt-2">
                                Data provided by Sentinel-2 Satellite. Updates every 2-5 days.
                            </p>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="card">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-lg text-primary-600 dark:text-primary-400">
                                <DollarSign size={18} />
                            </span>
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {expenses.slice(0, 5).map(expense => (
                                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold group-hover:bg-primary-100 transition-colors">
                                            ₱
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 transition-colors">{expense.description || expense.category}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                        ₱{Number(expense.amount).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {expenses.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-3">
                                        <DollarSign size={24} />
                                    </div>
                                    <p className="text-gray-500">No recent activity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Weather, Map, Calendar */}
                <div className="lg:col-span-1 space-y-6">
                    <WeatherWidget
                        coordinates={(() => {
                            if (currentFarm?.coordinates) {
                                try {
                                    const parsed = typeof currentFarm.coordinates === 'string'
                                        ? JSON.parse(currentFarm.coordinates)
                                        : currentFarm.coordinates;
                                    if (Array.isArray(parsed)) {
                                        return { lat: parsed[0], long: parsed[1] };
                                    }
                                    return parsed;
                                } catch (e) {
                                    console.error("Error parsing farm coordinates for weather", e);
                                    return null;
                                }
                            }
                            return null;
                        })()}
                        farmName={currentFarm?.name}
                    />

                    {/* Mini Map */}
                    <div className="card p-0 overflow-hidden border-0 shadow-sm">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapIcon size={18} className="text-primary-500" />
                                Farm Map
                            </h3>
                            <button
                                onClick={() => setIsMapModalOpen(true)}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                            >
                                Expand
                            </button>
                        </div>
                        <div
                            className="h-64 relative cursor-pointer group"
                            onClick={() => setIsMapModalOpen(true)}
                        >
                            <MapComponent
                                zones={zones}
                                center={(() => {
                                    if (currentFarm?.coordinates) {
                                        try {
                                            const parsed = typeof currentFarm.coordinates === 'string'
                                                ? JSON.parse(currentFarm.coordinates)
                                                : currentFarm.coordinates;
                                            return Array.isArray(parsed) ? parsed : [parsed.lat, parsed.long];
                                        } catch (e) { return null; }
                                    }
                                    return null;
                                })()}
                                farmLocation={(() => {
                                    if (currentFarm?.coordinates) {
                                        try {
                                            const parsed = typeof currentFarm.coordinates === 'string'
                                                ? JSON.parse(currentFarm.coordinates)
                                                : currentFarm.coordinates;
                                            return Array.isArray(parsed) ? parsed : [parsed.lat, parsed.long];
                                        } catch (e) { return null; }
                                    }
                                    return null;
                                })()}
                                zoom={15}
                                autoFitBounds={true}
                                onZoneDoubleClick={(zone) => {
                                    enterZone(zone);
                                }}
                                overlayUrl={overlayUrl}
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors flex items-center justify-center pointer-events-none">
                                <span className="opacity-0 group-hover:opacity-100 bg-white text-primary-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                                    Click to Expand
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <Calendar expenses={expenses} />
                </div>
            </div>

            {/* Stage Update Confirmation Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Update Crop Stage"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to move to the <strong>{targetStage?.name}</strong> stage?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmStageUpdate}
                            className="btn btn-primary"
                        >
                            Confirm Update
                        </button>
                    </div>
                </div>
            </Modal>

            {/* End Cycle Modal */}
            <EndCycleModal
                isOpen={isEndCycleModalOpen}
                onClose={() => setIsEndCycleModalOpen(false)}
                cycle={currentCycle}
            />

            {/* Map View Modal */}
            <Modal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                title="Farm Map"
                maxWidth="max-w-6xl"
            >
                <div className="h-[80vh]">
                    <MapComponent
                        zones={zones}
                        center={(() => {
                            if (currentFarm?.coordinates) {
                                try {
                                    const parsed = typeof currentFarm.coordinates === 'string'
                                        ? JSON.parse(currentFarm.coordinates)
                                        : currentFarm.coordinates;
                                    return Array.isArray(parsed) ? parsed : [parsed.lat, parsed.long];
                                } catch (e) { return null; }
                            }
                            return null;
                        })()}
                        farmLocation={(() => {
                            if (currentFarm?.coordinates) {
                                try {
                                    const parsed = typeof currentFarm.coordinates === 'string'
                                        ? JSON.parse(currentFarm.coordinates)
                                        : currentFarm.coordinates;
                                    return Array.isArray(parsed) ? parsed : [parsed.lat, parsed.long];
                                } catch (e) { return null; }
                            }
                            return null;
                        })()}
                        onZoneDoubleClick={(zone) => {
                            enterZone(zone);
                            setIsMapModalOpen(false);
                        }}
                        overlayUrl={overlayUrl}
                    />
                </div>
            </Modal>
        </div>
    );
};

const EndCycleModal = ({ isOpen, onClose, cycle }) => {
    const { endCycle } = useFarm();
    const [formData, setFormData] = useState({
        lkgPerTon: '',
        plantersSharePercent: '',
        sugarPrice: '',
        grossAmount: '',
        netAmount: '',
        plantersShareAmount: '',
        receiptImages: [] // Placeholder for now
    });

    const [receiptFiles, setReceiptFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            return newData;
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Store File objects for upload
        setReceiptFiles(prev => [...prev, ...files]);

        // Generate previews
        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        })).then(images => {
            setFormData(prev => ({ ...prev, receiptImages: [...prev.receiptImages, ...images] }));
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            receiptImages: prev.receiptImages.filter((_, i) => i !== index)
        }));
        setReceiptFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await endCycle(cycle.id, {
                ...formData,
                receiptFiles // Pass the raw files
            });
            onClose();
        } catch (error) {
            alert("Failed to end cycle: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="End Cycle & Record Milling Data">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LKG / Ton</label>
                        <input
                            type="number"
                            name="lkgPerTon"
                            value={formData.lkgPerTon}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="e.g. 1.95"
                            step="0.01"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sugar Price (₱)</label>
                        <input
                            type="number"
                            name="sugarPrice"
                            value={formData.sugarPrice}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="e.g. 2500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planter's Share (%)</label>
                        <input
                            type="number"
                            name="plantersSharePercent"
                            value={formData.plantersSharePercent}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            placeholder="e.g. 60"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Net Amount (₱)</label>
                        <input
                            type="number"
                            name="netAmount"
                            value={formData.netAmount}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-bold text-primary-600"
                            placeholder="Total Earnings"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Milling Receipts</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="milling-receipts"
                        />
                        <label htmlFor="milling-receipts" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors">
                            <span className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            </span>
                            <span className="text-sm font-medium">Click to upload photos</span>
                        </label>
                    </div>

                    {/* Image Previews */}
                    {formData.receiptImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {formData.receiptImages.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                    <img src={img} alt={`Receipt ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary bg-red-600 hover:bg-red-700 border-red-600 disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? "Ending Cycle..." : "End Cycle"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default Dashboard;
