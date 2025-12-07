import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, Sprout, Plus, ChevronDown, BarChart3, Menu, X, MapPin, ArrowLeft, Coins, History, Calendar } from 'lucide-react';
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
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                    ? 'bg-primary-800 text-white shadow-md shadow-primary-900/20'
                    : 'text-primary-100 hover:bg-primary-800/50 hover:text-white'
            )}
        >
            <Icon size={20} className={clsx("transition-colors", isActive ? "text-accent-400" : "text-primary-300 group-hover:text-accent-300")} />
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
            <div className="md:hidden fixed top-0 left-0 right-0 bg-primary-900 text-white p-4 z-30 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 text-accent-400">
                    <Sprout size={24} />
                    <h1 className="text-lg font-bold tracking-tight">Nangan Farm</h1>
                </div>
                <div className="flex items-center gap-3">
                    <ConnectionStatus />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-white hover:text-accent-400 transition-colors">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "w-72 bg-primary-900 text-white fixed h-full flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-primary-800/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 text-accent-400">
                            <div className="p-2 bg-primary-800 rounded-lg">
                                <Sprout size={24} />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Nangan Farm</h1>
                        </div>
                        <div className="md:block hidden">
                            <ConnectionStatus />
                        </div>
                    </div>

                    {/* Farm Selector */}
                    <div className="relative mb-3">
                        <label className="text-xs text-primary-300 font-medium mb-1.5 block uppercase tracking-wider">Current Farm</label>
                        <button
                            onClick={() => {
                                setIsFarmMenuOpen(!isFarmMenuOpen);
                                setIsCycleMenuOpen(false);
                                setIsZoneMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between bg-primary-800/50 p-3 rounded-xl hover:bg-primary-800 transition-all border border-primary-700/50 hover:border-primary-600 group"
                        >
                            <span className="font-medium truncate text-primary-50 group-hover:text-white">{currentFarm?.name || 'Select Farm'}</span>
                            <ChevronDown size={16} className="text-primary-400 group-hover:text-white transition-colors" />
                        </button>

                        {isFarmMenuOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-20 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                {farms.map(farm => (
                                    <button
                                        key={farm.id}
                                        onClick={() => {
                                            switchFarm(farm.id);
                                            setIsFarmMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition-colors border-b border-gray-50 last:border-0",
                                            currentFarm?.id === farm.id ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-600"
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
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-primary-600 flex items-center gap-2 font-medium bg-gray-50/50"
                                >
                                    <Plus size={16} /> Add New Farm
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Zone Selector */}
                    {currentFarm && (
                        <div className="relative mb-3">
                            <label className="text-xs text-primary-300 font-medium mb-1.5 block uppercase tracking-wider">Zone</label>
                            <button
                                onClick={() => {
                                    setIsZoneMenuOpen(!isZoneMenuOpen);
                                    setIsFarmMenuOpen(false);
                                    setIsCycleMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between bg-primary-800/50 p-3 rounded-xl hover:bg-primary-800 transition-all border border-primary-700/50 hover:border-primary-600 group"
                            >
                                <span className="font-medium truncate text-primary-50 group-hover:text-white">{currentZone?.name || 'All Zones (Farm View)'}</span>
                                <ChevronDown size={16} className="text-primary-400 group-hover:text-white transition-colors" />
                            </button>

                            {isZoneMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-20 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            switchZone(null);
                                            setIsZoneMenuOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition-colors border-b border-gray-50",
                                            !currentZone ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-600"
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
                                                "w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition-colors border-b border-gray-50 last:border-0",
                                                currentZone?.id === zone.id ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-600"
                                            )}
                                        >
                                            {zone.name}
                                        </button>
                                    ))}
                                    <Link
                                        to="/zones"
                                        onClick={() => setIsZoneMenuOpen(false)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-primary-600 flex items-center gap-2 font-medium bg-gray-50/50"
                                    >
                                        <Settings size={16} /> Manage Zones
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cycle Selector - Only visible when in a Zone */}
                    {currentZone && (
                        <div className="relative">
                            <label className="text-xs text-primary-300 font-medium mb-1.5 block uppercase tracking-wider">Cycle</label>
                            <button
                                onClick={() => {
                                    setIsCycleMenuOpen(!isCycleMenuOpen);
                                    setIsFarmMenuOpen(false);
                                    setIsZoneMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between bg-primary-800/50 p-3 rounded-xl hover:bg-primary-800 transition-all border border-primary-700/50 hover:border-primary-600 group"
                            >
                                <span className="font-medium truncate text-primary-50 group-hover:text-white">{currentCycle?.name || 'No Cycle'}</span>
                                <ChevronDown size={16} className="text-primary-400 group-hover:text-white transition-colors" />
                            </button>

                            {isCycleMenuOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-20 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                    {cycles.map(cycle => (
                                        <button
                                            key={cycle.id}
                                            onClick={() => {
                                                switchCycle(cycle.id);
                                                setIsCycleMenuOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between",
                                                currentCycle?.id === cycle.id ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-600"
                                            )}
                                        >
                                            <span>{cycle.name}</span>
                                            {cycle.status === 'active' && <span className="text-[10px] bg-accent-100 text-accent-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Active</span>}
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
                                            "w-full text-left px-4 py-3 text-sm flex items-center gap-2 font-medium bg-gray-50/50",
                                            activeCycle
                                                ? "text-gray-400 cursor-not-allowed"
                                                : "text-primary-600 hover:bg-gray-100"
                                        )}
                                        title={activeCycle ? "End current cycle first" : ""}
                                    >
                                        <Plus size={16} /> Start New Cycle
                                    </button>
                                    {activeCycle && (
                                        <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 border-t border-amber-100 font-medium">
                                            End active cycle first.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/expenses" icon={Coins} label="Expenses" />
                    <NavItem to="/tasks" icon={Calendar} label="Tasks" />
                    <NavItem to="/zones" icon={MapPin} label="Zones" />
                    <NavItem to="/analytics" icon={BarChart3} label="Analytics" />
                    <NavItem to="/history" icon={History} label="History" />
                    <NavItem to="/gallery" icon={Receipt} label="Gallery" />
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-primary-800/50 bg-primary-900/50">
                    <div className="flex items-center gap-3 mb-4 p-2 rounded-lg hover:bg-primary-800/50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center font-bold text-primary-900 shadow-lg ring-2 ring-primary-700">
                            {currentUser?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate text-white">{currentUser?.email}</p>
                            <p className="text-xs text-primary-300">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 bg-primary-800 hover:bg-primary-700 text-primary-100 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md border border-primary-700"
                    >
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Add Farm Modal */}
            {isAddFarmModalOpen && (
                <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 text-primary-900">Add New Farm</h2>
                        <form onSubmit={handleAddFarm}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Farm Name</label>
                                <input
                                    type="text"
                                    value={newFarmName}
                                    onChange={(e) => setNewFarmName(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="e.g., North Field"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddFarmModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newFarmName.trim() || isSubmitting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm hover:shadow-md transition-all"
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
                <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 text-primary-900">Start New Cycle</h2>
                        <form onSubmit={handleAddCycle}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cycle Name</label>
                                <input
                                    type="text"
                                    value={newCycleName}
                                    onChange={(e) => setNewCycleName(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="e.g., Cycle 2 (2025)"
                                    autoFocus
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={clsx(
                                        "flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all",
                                        cycleType === 'new'
                                            ? "bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500"
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
                                        "flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all",
                                        cycleType === 'ratoon'
                                            ? "bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500"
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

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCycleModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newCycleName.trim()}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium shadow-sm hover:shadow-md transition-all"
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
