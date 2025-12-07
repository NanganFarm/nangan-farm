import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { Plus, MapPin, Trash2, Sprout, Ruler, ArrowRight, Pencil, List, Map as MapIcon } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';

export const Zones = () => {
    const { zones, addZone, updateZone, deleteZone, currentFarm, enterZone, updateFarm } = useFarm();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [viewMode, setViewMode] = useState('map'); // 'list' or 'map'
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [drawingForZone, setDrawingForZone] = useState(null); // Track which zone we are drawing for
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        location: '',
        crop: '',
        coordinates: null
    });

    const openAddModal = () => {
        setEditingZone(null);
        setDrawingForZone(null);
        setFormData({ name: '', area: '', location: '', crop: '', coordinates: null });
        setIsModalOpen(true);
    };

    const openEditModal = (zone) => {
        setEditingZone(zone);
        setFormData({
            name: zone.name,
            area: zone.area,
            location: zone.location || '',
            crop: zone.crop || '',
            coordinates: zone.coordinates
        });
        setIsModalOpen(true);
    };

    const handleDrawOnMap = () => {
        if (!editingZone) return;
        setDrawingForZone(editingZone);
        setIsModalOpen(false);
        setViewMode('map');
    };

    const handleZoneCreated = (coordinates) => {
        if (drawingForZone) {
            // We were drawing for an existing zone
            setEditingZone(drawingForZone);
            setFormData({
                name: drawingForZone.name,
                area: drawingForZone.area,
                location: drawingForZone.location || '',
                crop: drawingForZone.crop || '',
                coordinates: coordinates
            });
            setDrawingForZone(null);
            setIsModalOpen(true);
        } else {
            // New zone creation
            setEditingZone(null);
            setFormData({ name: '', area: '', location: '', crop: '', coordinates });
            setIsModalOpen(true);
        }
    };

    const handleFarmLocationSelect = async (coordinates) => {
        if (!currentFarm) return;
        if (window.confirm("Set this location as the center of your farm?")) {
            try {
                await updateFarm(currentFarm.id, { coordinates: JSON.stringify(coordinates) });
                setIsSelectingLocation(false);
            } catch (error) {
                console.error("Failed to update farm location", error);
                alert("Failed to update farm location");
            }
        }
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
            setDrawingForZone(null);
            setFormData({ name: '', area: '', location: '', crop: '', coordinates: null });
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

    // Parse farm coordinates
    let farmCenter = null;
    if (currentFarm?.coordinates) {
        try {
            farmCenter = typeof currentFarm.coordinates === 'string'
                ? JSON.parse(currentFarm.coordinates)
                : currentFarm.coordinates;
        } catch (e) {
            console.error("Error parsing farm coordinates", e);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zones</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage land portions for <span className="font-medium text-gray-900 dark:text-white">{currentFarm?.name}</span>.</p>
                </div>
                <div className="flex gap-2">
                    {viewMode === 'map' && (
                        <button
                            onClick={() => setIsSelectingLocation(!isSelectingLocation)}
                            className={`btn ${isSelectingLocation ? 'bg-accent-500 hover:bg-accent-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'} shadow-sm`}
                        >
                            <MapPin size={18} className="mr-2" />
                            {isSelectingLocation ? 'Cancel Selection' : 'Set Farm Location'}
                        </button>
                    )}
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 dark:text-gray-400'}`}
                            title="Map View"
                        >
                            <MapIcon size={20} />
                        </button>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="btn btn-primary shadow-lg shadow-primary-900/20"
                    >
                        <Plus size={18} />
                        Add Zone
                    </button>
                </div>
            </div>

            {viewMode === 'map' ? (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    {drawingForZone ? (
                        <div className="mb-4 p-3 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 rounded-lg text-sm flex items-center gap-2 animate-pulse border border-accent-200 dark:border-accent-800">
                            <Pencil size={18} />
                            <strong>Drawing mode:</strong> Draw the boundary for <u>{drawingForZone.name}</u>. The form will re-open when you finish.
                        </div>
                    ) : (
                        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm flex items-start gap-2 border border-primary-100 dark:border-primary-800">
                            <MapIcon size={18} className="mt-0.5 shrink-0" />
                            <div>
                                <strong>Interactive Map:</strong>
                                <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                    <li>Use the drawing tools (top right) to outline your zones.</li>
                                    <li>Click <strong>Set Farm Location</strong> to pin your farm's center point on the map.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                    <MapComponent
                        zones={(() => {
                            if (!isModalOpen || !formData.coordinates) return zones;
                            if (editingZone) {
                                return zones.map(z => z.id === editingZone.id ? { ...z, coordinates: formData.coordinates } : z);
                            }
                            return [...zones, {
                                id: 'temp-new-zone',
                                name: formData.name || 'New Zone',
                                coordinates: formData.coordinates,
                                area: formData.area,
                                crop: formData.crop
                            }];
                        })()}
                        onZoneCreated={handleZoneCreated}
                        center={farmCenter}
                        farmLocation={farmCenter}
                        isSelectingLocation={isSelectingLocation}
                        onLocationSelect={handleFarmLocationSelect}
                        onZoneDoubleClick={handleEnterZone}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zones.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No zones added yet.</p>
                            <button onClick={openAddModal} className="text-primary-600 font-medium mt-2 hover:underline">Create your first zone</button>
                        </div>
                    ) : (
                        zones.map(zone => (
                            <div key={zone.id} className="card group relative hover:shadow-md transition-all duration-300">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(zone)}
                                        className="text-gray-400 hover:text-primary-500 bg-white dark:bg-gray-800 p-1 rounded-md shadow-sm"
                                        title="Edit Zone"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(zone.id)}
                                        className="text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 p-1 rounded-md shadow-sm"
                                        title="Delete Zone"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3
                                    className="font-bold text-lg text-gray-900 dark:text-white mb-3 pr-16 cursor-pointer hover:text-primary-600 transition-colors"
                                    onDoubleClick={() => handleEnterZone(zone)}
                                    title="Double click to manage zone"
                                >
                                    {zone.name}
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <Ruler size={16} className="text-primary-500" />
                                        <span>{zone.area}</span>
                                    </div>
                                    {zone.crop && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Sprout size={16} className="text-primary-500" />
                                            <span>{zone.crop}</span>
                                        </div>
                                    )}
                                    {zone.location && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <MapPin size={16} className="text-primary-500" />
                                            <span>{zone.location}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleEnterZone(zone)}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-primary-50 text-primary-700 py-2 rounded-lg hover:bg-primary-100 transition-colors font-medium dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                                >
                                    Manage Zone <ArrowRight size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingZone ? "Edit Zone" : "Add New Zone"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formData.coordinates ? (
                        <div className="p-3 bg-primary-50 text-primary-700 text-sm rounded-lg border border-primary-200 flex items-center justify-between gap-2 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} />
                                <span>Location coordinates captured!</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleDrawOnMap}
                                className="text-primary-700 font-medium hover:underline text-xs dark:text-primary-400"
                            >
                                Redraw
                            </button>
                        </div>
                    ) : (
                        editingZone && (
                            <div className="p-3 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-200 flex items-center justify-between gap-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                                <div className="flex items-center gap-2">
                                    <MapIcon size={16} />
                                    <span>No map boundary set.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDrawOnMap}
                                    className="text-primary-600 font-medium hover:underline text-xs dark:text-primary-400"
                                >
                                    Draw on Map
                                </button>
                            </div>
                        )
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
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
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="e.g., 2 hectares"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crop Type</label>
                        <input
                            type="text"
                            value={formData.crop}
                            onChange={e => setFormData({ ...formData, crop: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="e.g., Sugarcane"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location / Description</label>
                        <textarea
                            rows="2"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none dark:bg-gray-700 dark:text-white transition-all"
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
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
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
