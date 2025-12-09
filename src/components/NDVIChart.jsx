import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from 'recharts';
import { format } from 'date-fns';

const NDVIChart = ({ data, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-64 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg text-center p-4 border border-red-100 dark:border-red-900/30">
                <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <p className="text-red-600 font-bold mb-1">Unable to Load NDVI Data</p>
                <p className="text-xs text-red-500 dark:text-red-400 max-w-sm">{error}</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500">
                No NDVI data available for this period.
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                    <p className="font-bold text-gray-700 dark:text-gray-200">{format(new Date(label), 'PPP')}</p>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm text-primary-600">Mean: {payload[0].value.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Min: {payload[0].payload.min.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Max: {payload[0].payload.max.toFixed(2)}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 10,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                        dataKey="dt"
                        tickFormatter={(unix) => format(new Date(unix * 1000), 'MMM d')}
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                    />
                    <YAxis
                        domain={[0, 1]}
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                        label={{ value: 'NDVI', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine y={0.2} stroke="red" strokeDasharray="3 3" label={{ value: "Soil", position: "insideRight", fill: "red", fontSize: 10 }} />
                    <ReferenceLine y={0.6} stroke="green" strokeDasharray="3 3" label={{ value: "Healthy", position: "insideRight", fill: "green", fontSize: 10 }} />
                    <Line
                        type="monotone"
                        dataKey="mean"
                        name="Average NDVI"
                        stroke="#10B981"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={{ r: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default NDVIChart;
