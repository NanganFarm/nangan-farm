import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { api } from '../services/api';
import { Image as ImageIcon, Calendar, Tag } from 'lucide-react';

export const Gallery = () => {
    const { currentFarm, zones } = useFarm();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentFarm) {
            loadImages();
        }
    }, [currentFarm]);

    const loadImages = async () => {
        setLoading(true);
        try {
            // Fetch all expenses with images
            const expenses = await api.getExpenses(currentFarm.id);
            const expenseImages = expenses
                .filter(exp => exp.receiptImage)
                .map(exp => ({
                    id: exp.id,
                    url: exp.receiptImage,
                    type: 'Expense Receipt',
                    date: exp.date,
                    title: exp.category,
                    subtitle: `₱${Number(exp.amount).toLocaleString()}`,
                    zoneId: exp.zoneId
                }));

            // Fetch all cycles with milling images
            const cycles = await api.getCycles(currentFarm.id);
            const cycleImages = [];
            cycles.forEach(cycle => {
                if (cycle.milling?.receiptImages) {
                    cycle.milling.receiptImages.forEach((img, idx) => {
                        cycleImages.push({
                            id: `${cycle.id}-milling-${idx}`,
                            url: img,
                            type: 'Milling Record',
                            date: cycle.endDate,
                            title: cycle.name,
                            subtitle: 'Milling Document',
                            zoneId: cycle.zoneId
                        });
                    });
                }
            });

            const allImages = [...expenseImages, ...cycleImages].sort((a, b) => new Date(b.date) - new Date(a.date));
            setImages(allImages);
        } catch (error) {
            console.error("Failed to load gallery:", error);
        } finally {
            setLoading(false);
        }
    };

    const getZoneName = (zoneId) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Unknown Zone';
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading gallery...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Photo Gallery</h2>
                <p className="text-gray-500 dark:text-gray-400">All receipts and documents for <span className="font-medium text-gray-900 dark:text-white">{currentFarm?.name}</span>.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <ImageIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No photos uploaded yet.</p>
                    </div>
                ) : (
                    images.map(img => (
                        <div key={img.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 group">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                {img.url ? (
                                    <img
                                        src={img.url}
                                        alt={img.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                    {img.type}
                                </div>
                            </div>
                            <div className="p-3">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">{img.title}</h4>
                                <p className="text-sm text-emerald-600 font-medium mb-2">{img.subtitle}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} /> {img.date}
                                    </span>
                                    {img.zoneId && (
                                        <span className="flex items-center gap-1" title={getZoneName(img.zoneId)}>
                                            <Tag size={12} /> {getZoneName(img.zoneId)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
