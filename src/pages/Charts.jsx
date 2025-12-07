import React, { useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';

const COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#a3e635', '#84cc16'];

export const Charts = () => {
    const { currentFarm, currentCycle } = useFarm();
    const { theme } = useTheme();
    const [expenses, setExpenses] = useState([]);
    const [zones, setZones] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentFarm) {
            loadData();
        }
    }, [currentFarm, currentCycle]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [expenseData, zoneData, cycleData] = await Promise.all([
                currentCycle
                    ? api.getExpenses(currentFarm.id, currentCycle.id)
                    : api.getExpenses(currentFarm.id),
                api.getZones(currentFarm.id),
                api.getCycles(currentFarm.id)
            ]);
            setExpenses(expenseData);
            setZones(zoneData);
            setCycles(cycleData);
        } catch (error) {
            console.error("Failed to load expenses", error);
        } finally {
            setLoading(false);
        }
    };

    // Process Data for Pie Chart (By Category)
    const categoryData = Object.values(expenses.reduce((acc, curr) => {
        if (!acc[curr.category]) {
            acc[curr.category] = { name: curr.category, value: 0 };
        }
        acc[curr.category].value += Number(curr.amount);
        return acc;
    }, {}));

    // Process Data for Bar Chart (By Stage)
    const stageData = Object.values(expenses.reduce((acc, curr) => {
        const stage = curr.stage || 'Unknown';
        if (!acc[stage]) {
            acc[stage] = { name: stage, value: 0 };
        }
        acc[stage].value += Number(curr.amount);
        return acc;
    }, {}));

    // Process Data for Area Chart (Monthly Trend)
    const monthlyData = Object.values(expenses.reduce((acc, curr) => {
        const month = format(startOfMonth(parseISO(curr.date)), 'MMM yyyy');
        if (!acc[month]) {
            acc[month] = { name: month, value: 0, date: curr.date }; // keep date for sorting
        }
        acc[month].value += Number(curr.amount);
        return acc;
    }, {})).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Process Data for Bar Chart (By Zone) - Only for Farm View
    const zoneData = !currentCycle ? Object.values(expenses.reduce((acc, curr) => {
        let zoneName = 'General Farm';
        if (curr.zoneId) {
            const zone = zones.find(z => z.id === curr.zoneId);
            if (zone) zoneName = zone.name;
        } else if (curr.cycleId) {
            const cycle = cycles.find(c => c.id === curr.cycleId);
            if (cycle && cycle.zoneId) {
                const zone = zones.find(z => z.id === cycle.zoneId);
                if (zone) zoneName = zone.name;
            }
        }

        if (!acc[zoneName]) {
            acc[zoneName] = { name: zoneName, value: 0 };
        }
        acc[zoneName].value += Number(curr.amount);
        return acc;
    }, {})) : [];

    if (loading) return <div className="p-8 text-center text-gray-500">Loading charts...</div>;
    if (expenses.length === 0) return <div className="p-8 text-center text-gray-500">No expenses recorded yet.</div>;

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Analytics</h2>
                <p className="text-gray-500 dark:text-gray-400">Visual insights into your farm's spending.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Zone Bar Chart - Only visible in Farm View */}
                {!currentCycle && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors lg:col-span-2">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Expenses by Zone</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={zoneData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                    <Tooltip
                                        formatter={(value) => `₱${value.toLocaleString()}`}
                                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                    />
                                    <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Category Pie Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Expenses by Category</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stage Bar Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Expenses by Stage</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip
                                    formatter={(value) => `₱${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                />
                                <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Trend Area Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-colors">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Monthly Spending Trend</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip
                                    formatter={(value) => `₱${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#14b8a6" fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
