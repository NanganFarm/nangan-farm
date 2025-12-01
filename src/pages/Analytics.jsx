import React, { useEffect, useState, useRef } from 'react';
import { useFarm } from '../context/FarmContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';

const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

const ChartContainer = ({ children, height = 300, className = "" }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                window.requestAnimationFrame(() => {
                    if (!Array.isArray(entries) || !entries.length) return;
                    const entry = entries[0];
                    if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                        setVisible(true);
                    }
                });
            });
            resizeObserver.observe(ref.current);
            return () => resizeObserver.disconnect();
        }
    }, []);

    return (
        <div ref={ref} style={{ width: '100%', height }} className={`relative min-w-0 ${className}`}>
            {visible && children}
        </div>
    );
};

export const Analytics = () => {
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
            console.error("Failed to load analytics data", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Existing Charts Data ---

    // 1. Expenses by Category (Pie)
    const categoryData = Object.values(expenses.reduce((acc, curr) => {
        if (!acc[curr.category]) {
            acc[curr.category] = { name: curr.category, value: 0 };
        }
        acc[curr.category].value += Number(curr.amount);
        return acc;
    }, {}));

    // 2. Expenses by Stage (Bar)
    const stageData = Object.values(expenses.reduce((acc, curr) => {
        const stage = curr.stage || 'Unknown';
        if (!acc[stage]) {
            acc[stage] = { name: stage, value: 0 };
        }
        acc[stage].value += Number(curr.amount);
        return acc;
    }, {}));

    // 3. Monthly Spending Trend (Area)
    const monthlyData = Object.values(expenses.reduce((acc, curr) => {
        const month = format(startOfMonth(parseISO(curr.date)), 'MMM yyyy');
        if (!acc[month]) {
            acc[month] = { name: month, value: 0, date: curr.date };
        }
        acc[month].value += Number(curr.amount);
        return acc;
    }, {})).sort((a, b) => new Date(a.date) - new Date(b.date));

    // --- New Advanced Analytics Data ---

    // 4. Yield per Zone (Bar) - LKG/Ha
    // We need completed cycles with milling records.
    const yieldData = zones.map(zone => {
        const zoneCycles = cycles.filter(c => c.zoneId === zone.id && c.milling);
        if (zoneCycles.length === 0) return null;

        const totalLkgPerHa = zoneCycles.reduce((sum, cycle) => {
            // Calculate LKG for this cycle: Gross Amount / Sugar Price
            // Note: This is an estimation if LKG is not stored directly.
            // If milling has lkgPerTon, we need Tons.
            // Let's assume Gross Amount = Total LKG * Sugar Price.
            // So Total LKG = Gross Amount / Sugar Price.

            const milling = cycle.milling;
            if (!milling || !milling.grossAmount || !milling.sugarPrice) return sum;

            const totalLkg = milling.grossAmount / milling.sugarPrice;
            const lkgPerHa = totalLkg / (zone.area || 1); // Avoid division by zero
            return sum + lkgPerHa;
        }, 0);

        const avgLkgPerHa = totalLkgPerHa / zoneCycles.length;

        return {
            name: zone.name,
            yield: parseFloat(avgLkgPerHa.toFixed(2)),
            cycles: zoneCycles.length
        };
    }).filter(Boolean);

    // 5. Profitability by Cycle (Composed: Bar + Line)
    // Revenue vs Expenses per Cycle
    const profitabilityData = cycles
        .filter(c => c.milling) // Only completed cycles with revenue
        .map(cycle => {
            const cycleExpenses = expenses.filter(e => e.cycleId === cycle.id).reduce((sum, e) => sum + Number(e.amount), 0);
            const revenue = cycle.milling?.netAmount || 0;
            const profit = revenue - cycleExpenses;

            return {
                name: cycle.name,
                revenue: revenue,
                expenses: cycleExpenses,
                profit: profit
            };
        });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h2>
                <p className="text-gray-500 dark:text-gray-400">Deep insights into yield, profitability, and farm performance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Profitability Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-colors min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Profitability by Cycle</h3>
                    <ChartContainer height={400}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={profitabilityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip
                                    formatter={(value) => `₱${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>

                {/* Yield per Zone */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Avg. Yield per Zone (LKG/Ha)</h3>
                    <ChartContainer height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yieldData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                />
                                <Bar dataKey="yield" name="LKG/Ha" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Expenses by Category</h3>
                    <ChartContainer height={300}>
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
                    </ChartContainer>
                </div>

                {/* Monthly Trend Area Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2 transition-colors min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-6">Monthly Spending Trend</h3>
                    <ChartContainer height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                                <Tooltip
                                    formatter={(value) => `₱${value.toLocaleString()}`}
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#000' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </div>
        </div>
    );
};
