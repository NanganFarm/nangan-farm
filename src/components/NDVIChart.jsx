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

const NDVIChart = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
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
