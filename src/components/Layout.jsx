import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, Sprout, Plus, ChevronDown, BarChart3, Menu, X, MapPin, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null; // Don't show anything if online

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-200 rounded-full text-xs font-medium border border-red-500/30">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Offline
        </div>
    );
};

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                    ? 'bg-emerald-800 text-white'
                    : 'text-emerald-100 hover:bg-emerald-800/50'
            )}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </Link>
    );
};

export const Layout = ({ children }) => {
    const { farms, currentFarm, switchFarm, addFarm, cycles, currentCycle, switchCycle, createCycle, currentZone, switchZone, exitZone, zones } = useFarm();
    const { logout, currentUser } = useAuth();
    const [isFarmMenuOpen, setIsFarmMenuOpen] = useState(false);
    const [isZoneMenuOpen, setIsZoneMenuOpen] = useState(false);
    const [isCycleMenuOpen, setIsCycleMenuOpen] = useState(false);
    const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);
    const [isAddCycleModalOpen, setIsAddCycleModalOpen] = useState(false);
    const [newFarmName, setNewFarmName] = useState('');
    const [newCycleName, setNewCycleName] = useState('');
    const [cycleType, setCycleType] = useState('new');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleAddCycle = async (e) => {
        e.preventDefault();
        if (newCycleName.trim()) {
            try {
                await createCycle({
                    name: newCycleName,
                    startDate: startDate,
                    type: cycleType
                });
                setNewCycleName('');
                setCycleType('new');
                setStartDate(new Date().toISOString().split('T')[0]);
                setIsAddCycleModalOpen(false);
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddFarm = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        console.log("Attempting to add farm:", newFarmName); // Debug log
        if (newFarmName.trim()) {
            setIsSubmitting(true);
            try {
                // Create a timeout promise (10 seconds)
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out.")), 10000)
                );

                // Race the addFarm call against the timeout
                const result = await Promise.race([
                    addFarm({ name: newFarmName }),
                    timeout
                ]);

                console.log("Farm added successfully:", result); // Debug log
                setNewFarmName('');
                setIsAddFarmModalOpen(false);
                alert("Farm created successfully!"); // Success feedback
            } catch (error) {
                console.error("Failed to add farm:", error);

                let errorMessage = "Error creating farm: " + error.message;
                if (error.message === "Request timed out.") {
                    errorMessage = "⚠️ Connection timed out.\n\nYour login session may have expired.\nPlease LOG OUT and LOG IN again to refresh your connection.";
                }

                alert(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Check for active cycle in current zone
    const activeCycle = currentZone ? cycles.find(c => c.status === 'active') : null;

    return (
        <div className="flex min-h-screen transition-colors duration-200 bg-gray-50 dark:bg-gray-900">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-emerald-900 text-white p-4 z-30 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 text-amber-400">
                    <Sprout size={24} />
                    <h1 className="text-lg font-bold tracking-tight">Nangan Farm</h1>
                </div>
                <div className="flex items-center gap-3">
                    <ConnectionStatus />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "w-64 bg-emerald-900 text-white fixed h-full flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-emerald-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Sprout size={28} />
                            <h1 className="text-xl font-bold tracking-tight">Nangan Farm</h1>
                        </div>
                        <div className="md:block hidden">
                            <ConnectionStatus />
                        </div>
                    </div>

                    {/* Farm Selector */}
                    <div className="relative mb-3">
                        <label className="text-xs text-emerald-400 font-medium mb-1 block">Farm</label>
                        <button
                            onClick={() => {
                                setIsFarmMenuOpen(!isFarmMenuOpen);
                                setIsCycleMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between bg-emerald-800/50 p-2 rounded-lg hover:bg-emerald-800 transition-colors"
                        >
                            <span className="font-medium truncate">{currentFarm?.name || 'Select Farm'}</span>
                            <ChevronDown size={16} />
                        </button>

                        {isFarmMenuOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-20">
                                {farms.map(farm => (
                                    <button
                                        key={farm.id}
                                        onClick={() => {
                                            switchFarm(farm.id);
                                            setIsFarmMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left px-4 py-2 hover:bg-gray-100 text-sm",
                                            currentFarm?.id === farm.id && "bg-emerald-50 text-emerald-700 font-medium"
                                        )}
                                    >
                                        {farm.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setIsFarmMenuOpen(false);
                                        setIsAddFarmModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-emerald-600 flex items-center gap-2 border-t"
                                >
                                    <Plus size={14} /> Add New Farm
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Zone Selector */}
                    {currentFarm && (
                        <div className="relative mb-3">
                            <label className="text-xs text-emerald-400 font-medium mb-1 block">Zone</label>
                            <button
                                onClick={() => {
                                    setIsZoneMenuOpen(!isZoneMenuOpen);
                                    setIsFarmMenuOpen(false);
                                    setIsCycleMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between bg-emerald-800/50 p-2 rounded-lg hover:bg-emerald-800 transition-colors"
                            >
                                <span className="font-medium truncate">{currentZone?.name || 'All Zones (Farm View)'}</span>
                                <ChevronDown size={16} />
                            </button>

                            {isZoneMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-20">
                                    <button
                                        onClick={() => {
                                            switchZone(null);
                                            setIsZoneMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left px-4 py-2 hover:bg-gray-100 text-sm",
                                            !currentZone && "bg-emerald-50 text-emerald-700 font-medium"
                                        )}
                                    >
                                        All Zones (Farm View)
                                    </button>
                                    {zones.map(zone => (
                                        <button
                                            key={zone.id}
                                            onClick={() => {
                                                switchZone(zone.id);
                                                setIsZoneMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-2 hover:bg-gray-100 text-sm",
                                                currentZone?.id === zone.id && "bg-emerald-50 text-emerald-700 font-medium"
                                            )}
                                        >
                                            {zone.name}
                                        </button>
                                    ))}
                                    <Link
                                        to="/zones"
                                        onClick={() => setIsZoneMenuOpen(false)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-emerald-600 flex items-center gap-2 border-t"
                                    >
                                        <Settings size={14} /> Manage Zones
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cycle Selector - Only visible when in a Zone */}
                    {currentZone && (
                        <div className="relative">
                            <label className="text-xs text-emerald-400 font-medium mb-1 block">Cycle</label>
                            <button
                                onClick={() => {
                                    setIsCycleMenuOpen(!isCycleMenuOpen);
                                    setIsFarmMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between bg-emerald-800/50 p-2 rounded-lg hover:bg-emerald-800 transition-colors"
                            >
                                <span className="font-medium truncate">{currentCycle?.name || 'No Cycle'}</span>
                                <ChevronDown size={16} />
                            </button>

                            {isCycleMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-20">
                                    {cycles.map(cycle => (
                                        <button
                                            key={cycle.id}
                                            onClick={() => {
                                                switchCycle(cycle.id);
                                                setIsCycleMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-2 hover:bg-gray-100 text-sm",
                                                currentCycle?.id === cycle.id && "bg-emerald-50 text-emerald-700 font-medium"
                                            )}
                                        >
                                            {cycle.name}
                                            {cycle.status === 'active' && <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-1.5 rounded-full">Active</span>}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            if (!activeCycle) {
                                                setIsCycleMenuOpen(false);
                                                setIsAddCycleModalOpen(true);
                                            }
                                        }}
                                        disabled={!!activeCycle}
                                        className={clsx(
                                            "w-full text-left px-4 py-2 text-sm flex items-center gap-2 border-t",
                                            activeCycle
                                                ? "text-gray-400 cursor-not-allowed bg-gray-50"
                                                : "text-emerald-600 hover:bg-gray-100"
                                        )}
                                        title={activeCycle ? "End current cycle first" : ""}
                                    >
                                        <Plus size={14} /> Start New Cycle
                                    </button>
                                    {activeCycle && (
                                        <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 border-t border-amber-100">
                                            End active cycle first.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/expenses" icon={Receipt} label="Expenses" />
                    <NavItem to="/charts" icon={BarChart3} label="Charts" />
                    <NavItem to="/history" icon={Receipt} label="History" />
                    <NavItem to="/gallery" icon={Receipt} label="Gallery" />
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-emerald-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-emerald-900">
                            {currentUser?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{currentUser?.email}</p>
                            <p className="text-xs text-emerald-300">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 px-4 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg text-sm font-medium transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Add Farm Modal */}
            {isAddFarmModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Add New Farm</h2>
                        <form onSubmit={handleAddFarm}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                                <input
                                    type="text"
                                    value={newFarmName}
                                    onChange={(e) => setNewFarmName(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g., North Field"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddFarmModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newFarmName.trim() || isSubmitting}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Farm"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Cycle Modal */}
            {isAddCycleModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Start New Cycle</h2>
                        <form onSubmit={handleAddCycle}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
                                <input
                                    type="text"
                                    value={newCycleName}
                                    onChange={(e) => setNewCycleName(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g., Cycle 2 (2025)"
                                    autoFocus
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={clsx(
                                        "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all",
                                        cycleType === 'new'
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                                            : "border-gray-200 hover:bg-gray-50"
                                    )}>
                                        <input
                                            type="radio"
                                            name="cycleType"
                                            value="new"
                                            checked={cycleType === 'new'}
                                            onChange={(e) => setCycleType(e.target.value)}
                                            className="sr-only"
                                        />
                                        <span className="font-medium">🌱 Start Fresh</span>
                                    </label>
                                    <label className={clsx(
                                        "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all",
                                        cycleType === 'ratoon'
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                                            : "border-gray-200 hover:bg-gray-50"
                                    )}>
                                        <input
                                            type="radio"
                                            name="cycleType"
                                            value="ratoon"
                                            checked={cycleType === 'ratoon'}
                                            onChange={(e) => setCycleType(e.target.value)}
                                            className="sr-only"
                                        />
                                        <span className="font-medium">🔄 Ratoon</span>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {cycleType === 'new'
                                        ? "For new planting or replanting."
                                        : "For continuing crop from previous harvest."}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCycleModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newCycleName.trim()}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    Start Cycle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
