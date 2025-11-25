import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { api } from '../services/api';
import { Calendar, DollarSign, Sprout, ArrowRight, FileText } from 'lucide-react';
import clsx from 'clsx';

export const CycleHistory = () => {
    const { currentFarm, zones, currentZone } = useFarm();
    const [historyCycles, setHistoryCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedZoneId, setSelectedZoneId] = useState('all');

    useEffect(() => {
        if (currentFarm) {
            loadHistory();
        }
    }, [currentFarm, currentZone, selectedZoneId]);

    // Reset filter when switching contexts
    useEffect(() => {
        if (currentZone) {
            setSelectedZoneId(currentZone.id);
        } else {
            setSelectedZoneId('all');
        }
    }, [currentZone]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const allCycles = await api.getCycles(currentFarm.id);

            // Filter for completed cycles
            let filtered = allCycles.filter(c => c.status === 'completed');

            // Apply Zone Filter
            // If we are in a specific zone context, strictly filter by that zone
            if (currentZone) {
                filtered = filtered.filter(c => c.zoneId === currentZone.id);
            }
            // If we are in Farm View, check the dropdown filter
            else if (selectedZoneId !== 'all') {
                filtered = filtered.filter(c => c.zoneId === selectedZoneId);
            }

            // Enhance with expense totals
            const enhancedCycles = await Promise.all(filtered.map(async (cycle) => {
                const expenses = await api.getExpenses(currentFarm.id, cycle.id);
                const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                return { ...cycle, totalExpenses };
            }));

            // Sort by end date descending
            enhancedCycles.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
            setHistoryCycles(enhancedCycles);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    };

    const getZoneName = (zoneId) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Unknown Zone';
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading history...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentZone ? `History: ${currentZone.name}` : 'Farm Cycle History'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Past harvests and performance records for <span className="font-medium text-gray-900 dark:text-white">{currentZone ? currentZone.name : currentFarm?.name}</span>.
                    </p>
                </div>

                {/* Zone Filter Dropdown - Only visible in Farm View */}
                {!currentZone && (
                    <div className="w-full md:w-64">
                        <select
                            value={selectedZoneId}
                            onChange={(e) => setSelectedZoneId(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="all">All Zones</option>
                            {zones.map(zone => (
                                <option key={zone.id} value={zone.id}>{zone.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="grid gap-4">
                {historyCycles.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Sprout size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {currentZone || selectedZoneId !== 'all'
                                ? "No completed cycles found for this zone."
                                : "No completed cycles yet."}
                        </p>
                    </div>
                ) : (
                    historyCycles.map(cycle => (
                        <div key={cycle.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cycle.name}</h3>
                                        <span className={clsx(
                                            "text-xs px-2 py-0.5 rounded-full font-medium border",
                                            cycle.type === 'ratoon'
                                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                        )}>
                                            {cycle.type === 'ratoon' ? 'Ratoon' : 'New Plant'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <Sprout size={14} /> {getZoneName(cycle.zoneId)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{cycle.startDate} - {cycle.endDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
                                    <p className="text-xl font-bold text-red-600">₱{cycle.totalExpenses.toLocaleString()}</p>
                                </div>

                                {cycle.milling ? (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Net Income</p>
                                            <p className="text-xl font-bold text-emerald-600">₱{Number(cycle.milling.netAmount).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Production</p>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white">{cycle.milling.lkgPerTon || 0} LKG/Ton</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-2 flex items-center text-gray-400 italic text-sm">
                                        No milling data recorded
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
