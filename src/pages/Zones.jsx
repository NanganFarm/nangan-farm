import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Plus, MapPin, Trash2, Sprout, Ruler, ArrowRight, Pencil } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';

export const Zones = () => {
    const { zones, addZone, updateZone, deleteZone, currentFarm, enterZone } = useFarm();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        location: '',
        crop: ''
    });

    const openAddModal = () => {
        setEditingZone(null);
        setFormData({ name: '', area: '', location: '', crop: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (zone) => {
        setEditingZone(zone);
        setFormData({
            name: zone.name,
            area: zone.area,
            location: zone.location || '',
            crop: zone.crop || ''
        });
        setIsModalOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.area || isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (editingZone) {
                await updateZone(editingZone.id, formData);
            } else {
                await addZone(formData);
            }
            setIsModalOpen(false);
            setEditingZone(null);
            setFormData({ name: '', area: '', location: '', crop: '' });
        } catch (error) {
            console.error("Failed to save zone", error);
            alert(`Failed to save zone: ${error.message || error.error_description || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this zone?")) return;
        await deleteZone(id);
    };

    const handleEnterZone = (zone) => {
        enterZone(zone);
        navigate('/');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zones</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage land portions for <span className="font-medium text-gray-900 dark:text-white">{currentFarm?.name}</span>.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="btn btn-primary shadow-lg shadow-emerald-900/20"
                >
                    <Plus size={18} />
                    Add Zone
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No zones added yet.</p>
                        <button onClick={openAddModal} className="text-emerald-600 font-medium mt-2 hover:underline">Create your first zone</button>
                    </div>
                ) : (
                    zones.map(zone => (
                        <div key={zone.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(zone)}
                                    className="text-gray-400 hover:text-emerald-500"
                                    title="Edit Zone"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(zone.id)}
                                    className="text-gray-400 hover:text-red-500"
                                    title="Delete Zone"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 pr-16">{zone.name}</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <Ruler size={16} className="text-emerald-500" />
                                    <span>{zone.area}</span>
                                </div>
                                {zone.crop && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <Sprout size={16} className="text-emerald-500" />
                                        <span>{zone.crop}</span>
                                    </div>
                                )}
                                {zone.location && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <MapPin size={16} className="text-emerald-500" />
                                        <span>{zone.location}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleEnterZone(zone)}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                            >
                                Manage Zone <ArrowRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingZone ? "Edit Zone" : "Add New Zone"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., North Field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area Size</label>
                        <input
                            type="text"
                            required
                            value={formData.area}
                            onChange={e => setFormData({ ...formData, area: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., 2 hectares"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crop Type</label>
                        <input
                            type="text"
                            value={formData.crop}
                            onChange={e => setFormData({ ...formData, crop: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., Sugarcane"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location / Description</label>
                        <textarea
                            rows="2"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., Near the river"
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn btn-secondary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                editingZone ? "Save Changes" : "Save Zone"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
