import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import { DollarSign, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import clsx from 'clsx';
import { Modal } from '../components/Modal';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between transition-colors">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

const ProgressBar = ({ stages, currentStageId, onStageClick }) => {
    const currentIndex = stages.findIndex(s => s.id === currentStageId);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">Crop Progress</h3>
            <div className="w-full">
                <div className="relative flex items-center justify-between px-2 md:px-10 z-0 w-full">
                    {/* Progress Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 pointer-events-none"></div>
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all duration-500 pointer-events-none"
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
                                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white dark:bg-gray-800",
                                    isCompleted ? "border-emerald-500 text-emerald-500" : "border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600",
                                    isCurrent && "ring-4 ring-emerald-100 dark:ring-emerald-900 scale-110"
                                )}>
                                    {isCompleted ? <CheckCircle2 size={16} className="md:w-5 md:h-5 text-white" fill="currentColor" /> : <Circle size={16} className="md:w-5 md:h-5" />}
                                </div>
                                <span className={clsx(
                                    "text-[10px] md:text-xs font-medium transition-colors absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap",
                                    isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                                )}>
                                    {stage.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="h-10"></div> {/* Spacer for labels */}
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Event Calendar</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-medium text-gray-700 dark:text-gray-200 min-w-[100px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
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
                                "aspect-square rounded-lg border p-1 flex flex-col items-center justify-start relative hover:border-emerald-500 transition-colors cursor-pointer min-h-[50px]",
                                isToday(day) ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "border-gray-50 dark:border-gray-700",
                                hasEvents && "border-emerald-100 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
                            )}
                            title={dayExpenses.map(e => `${e.description || e.category}: ₱${Number(e.amount).toLocaleString()}`).join('\n')}
                        >
                            <span className={clsx(
                                "text-xs font-medium",
                                isToday(day) ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"
                            )}>
                                {format(day, 'd')}
                            </span>
                            {hasEvents && (
                                <div className="mt-1 flex gap-0.5 flex-wrap justify-center">
                                    {dayExpenses.map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    ))}
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
    const { currentFarm, currentCycle, currentZone, updateCycleStage } = useFarm();
    const [expenses, setExpenses] = useState([]);
    const [zones, setZones] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isEndCycleModalOpen, setIsEndCycleModalOpen] = useState(false);
    const [targetStage, setTargetStage] = useState(null);

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
                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                    <DollarSign size={48} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Nangan Farm!</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    It looks like you haven't created any farms yet.
                    Click the <strong>"Add New Farm"</strong> button in the sidebar to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentCycle ? `Dashboard: ${currentCycle.name}` : 'Farm Overview'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {currentCycle
                            ? 'Track your crop progress and expenses.'
                            : 'Aggregated view of all zones and expenses.'}
                    </p>
                </div>
                {currentCycle && (
                    <button
                        onClick={() => setIsEndCycleModalOpen(true)}
                        className="btn bg-red-600 hover:bg-red-700 text-white border-red-600"
                    >
                        End Cycle
                    </button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Expenses"
                    value={`₱${totalExpenses.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-emerald-500"
                />
                <StatCard
                    title={currentCycle ? "Current Stage" : "Active Zones"}
                    value={currentCycle
                        ? (stages.find(s => s.id === currentCycle.currentStageId)?.name || 'Unknown')
                        : zones.length
                    }
                    icon={CheckCircle2}
                    color="bg-blue-500"
                />
                <StatCard
                    title={currentCycle ? "Days Active" : "Total Cycles"}
                    value={currentCycle
                        ? Math.ceil((new Date() - new Date(currentCycle.startDate)) / (1000 * 60 * 60 * 24))
                        : cycles.length
                    }
                    icon={Circle}
                    color="bg-purple-500"
                />
            </div>

            {/* Zone Breakdown (Only in Farm View) */}
            {!currentCycle && zones.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zoneTotals.map(zone => (
                        <div key={zone.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white">{zone.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{zone.crop} • {zone.area}</p>
                            <div className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {expenses.slice(0, 5).map(expense => (
                            <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                        ₱
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{expense.description || expense.category}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ₱{Number(expense.amount).toLocaleString()}
                                </span>
                            </div>
                        ))}
                        {expenses.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No recent activity.</p>
                        )}
                    </div>
                </div>

                {/* Calendar */}
                <div className="lg:col-span-1">
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate amounts if possible
            if (name === 'lkgPerTon' || name === 'sugarPrice' || name === 'plantersSharePercent') {
                // This is a simplified calculation placeholder. 
                // Actual formula depends on tonnage which isn't in cycle data yet, 
                // so we'll just let user input amounts for now or implement basic logic later.
            }
            return newData;
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await endCycle(cycle.id, formData);
            onClose();
        } catch (error) {
            alert("Failed to end cycle: " + error.message);
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
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-bold text-emerald-600"
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
                        <label htmlFor="milling-receipts" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors">
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
                    <button type="submit" className="btn btn-primary bg-red-600 hover:bg-red-700 border-red-600">End Cycle</button>
                </div>
            </form>
        </Modal>
    );
};
