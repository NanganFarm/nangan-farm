import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Plus, Pencil, Trash2, Tag, Sprout } from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { useFarm } from '../context/FarmContext';

export const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const { cycles, deleteCycle, currentFarm } = useFarm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cycleToDelete, setCycleToDelete] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will remove the category from the list but keep existing expenses.")) return;
        try {
            await api.deleteCategory(id);
            loadCategories(); // Reload to ensure IDs and list are synced
        } catch (error) {
            console.error("Failed to delete category", error);
        }
    };

    const handleDeleteCycle = (cycle) => {
        setCycleToDelete(cycle);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCycle = async () => {
        if (cycleToDelete) {
            await deleteCycle(cycleToDelete.id);
            setIsDeleteModalOpen(false);
            setCycleToDelete(null);
        }
    };

    const [isFarmDeleteModalOpen, setIsFarmDeleteModalOpen] = useState(false);
    const [farmToDelete, setFarmToDelete] = useState(null);

    const handleDeleteFarm = (farm) => {
        setFarmToDelete(farm);
        setIsFarmDeleteModalOpen(true);
    };

    const confirmDeleteFarm = async () => {
        if (farmToDelete) {
            await deleteFarm(farmToDelete.id);
            setIsFarmDeleteModalOpen(false);
            setFarmToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, { name: formData.name });
            } else {
                if (!currentUser) return;
                const newCategory = { name: formData.name, userId: currentUser.id };
                await api.addCategory(newCategory);
            }
            loadCategories(); // Reload to ensure IDs and list are synced
            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData({ name: '' });
        } catch (error) {
            console.error("Failed to save category", error);
        }
    };

    const { currentUser } = useAuth();
    const [diagnosticResults, setDiagnosticResults] = useState({
        internet: 'Checking...',
        dbRead: 'Pending',
        dbWrite: 'Pending'
    });
    const [diagnosticError, setDiagnosticError] = useState(null);

    const runDiagnostics = async () => {
        setLoading(true);
        setDiagnosticError(null);
        setDiagnosticResults({ internet: 'Checking...', dbRead: 'Pending', dbWrite: 'Pending' });

        // 1. Check Internet
        const isOnline = navigator.onLine;
        setDiagnosticResults(prev => ({ ...prev, internet: isOnline ? 'Online' : 'Offline' }));

        if (!isOnline) {
            setLoading(false);
            return;
        }

        try {
            // 2. Check DB Read
            setDiagnosticResults(prev => ({ ...prev, dbRead: 'Testing...' }));
            // Try to fetch categories (lightweight)
            await api.getCategories();
            setDiagnosticResults(prev => ({ ...prev, dbRead: 'Success' }));

            // 3. Check DB Write
            if (currentUser) {
                setDiagnosticResults(prev => ({ ...prev, dbWrite: 'Testing...' }));
                // Try to add and delete a dummy category
                const testCat = await api.addCategory({ name: '_DIAGNOSTIC_TEST_', userId: currentUser.id });
                await api.deleteCategory(testCat.id);
                setDiagnosticResults(prev => ({ ...prev, dbWrite: 'Success' }));
            } else {
                setDiagnosticResults(prev => ({ ...prev, dbWrite: 'Skipped (No User)' }));
            }

        } catch (error) {
            console.error("Diagnostic failed:", error);
            setDiagnosticError(error.message);
            if (diagnosticResults.dbRead !== 'Success') {
                setDiagnosticResults(prev => ({ ...prev, dbRead: 'Failed' }));
            } else {
                setDiagnosticResults(prev => ({ ...prev, dbWrite: 'Failed' }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <p className="text-gray-500 dark:text-gray-400">Manage your application preferences.</p>
            </div>

            {/* System Check Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        System Diagnostics
                    </h3>
                    <button
                        onClick={runDiagnostics}
                        disabled={loading}
                        className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Running...' : 'Run Test'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Connectivity</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Internet Status</span>
                            <span className={`text-sm font-medium ${diagnosticResults.internet === 'Online' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {diagnosticResults.internet}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Database Read</span>
                            <span className={`text-sm font-medium ${diagnosticResults.dbRead === 'Success' ? 'text-emerald-600' : diagnosticResults.dbRead === 'Failed' ? 'text-red-600' : 'text-gray-400'}`}>
                                {diagnosticResults.dbRead}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Database Write</span>
                            <span className={`text-sm font-medium ${diagnosticResults.dbWrite === 'Success' ? 'text-emerald-600' : diagnosticResults.dbWrite === 'Failed' ? 'text-red-600' : 'text-gray-400'}`}>
                                {diagnosticResults.dbWrite}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">User Session</p>
                        <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 break-all block mb-2">
                            {currentUser ? currentUser.id : 'Not Logged In'}
                        </code>
                        {currentUser && (
                            <p className="text-xs text-emerald-600">Session Active</p>
                        )}
                    </div>
                </div>
                {diagnosticError && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        <strong>Error Detail:</strong> {diagnosticError}
                    </div>
                )}
            </div>

            {/* Appearance Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sun size={20} className="text-amber-500" /> Appearance
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>

            {/* Categories Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tag size={20} className="text-emerald-600" /> Expense Categories
                    </h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary text-sm"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                </div>

                <div className="space-y-2">
                    {loading ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
                    ) : (
                        categories.map(category => (
                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{category.name}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Farm Management Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-emerald-600" /> Farm Management
                </h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{currentFarm?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Farm</p>
                    </div>
                    <button
                        onClick={() => handleDeleteFarm(currentFarm)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Trash2 size={16} /> Delete Farm
                    </button>
                </div>
            </div>

            {/* Cycle Management Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sprout size={20} className="text-emerald-600" /> Cycle Management
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Manage cycles for <span className="font-medium text-gray-900 dark:text-white">{currentFarm?.name}</span>.
                </p>

                <div className="space-y-2">
                    {cycles.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No cycles found.</p>
                    ) : (
                        cycles.map(cycle => (
                            <div key={cycle.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{cycle.name}</span>
                                    {cycle.status === 'active' && (
                                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Active</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteCycle(cycle)}
                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Cycle"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Data Management Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trash2 size={20} className="text-red-600" /> Data Management
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Reset your data to default settings. <span className="font-bold text-red-600">Warning: This cannot be undone.</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to RESET all categories? This will delete your custom categories and restore defaults.")) {
                                setLoading(true);
                                try {
                                    await api.resetCategories(currentUser.id);
                                    await loadCategories();
                                    alert("Categories reset successfully.");
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to reset categories.");
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        className="btn border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Reset Categories
                    </button>
                    <button
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to RESET all stages? This will delete all stages and restore defaults.")) {
                                setLoading(true);
                                try {
                                    await api.resetStages();
                                    alert("Stages reset successfully.");
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to reset stages.");
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        className="btn border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Reset Stages
                    </button>
                </div>
            </div>

            {/* Category Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: '' });
                }}
                title={editingCategory ? "Edit Category" : "New Category"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., Fertilizers"
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
                        <button type="submit" className="btn btn-primary">
                            Save Category
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Cycle Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setCycleToDelete(null);
                }}
                title="Delete Cycle"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{cycleToDelete?.name}</span>?
                    </p>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                        Warning: This action cannot be undone. Associated expenses will remain but will be unlinked.
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setCycleToDelete(null);
                            }}
                            className="btn btn-secondary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteCycle}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete Cycle
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Delete Farm Confirmation Modal */}
            <Modal
                isOpen={isFarmDeleteModalOpen}
                onClose={() => {
                    setIsFarmDeleteModalOpen(false);
                    setFarmToDelete(null);
                }}
                title="Delete Farm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{farmToDelete?.name}</span>?
                    </p>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm rounded-lg border border-red-200 dark:border-red-800">
                        Warning: This action is irreversible. All cycles, expenses, and zones associated with this farm will be lost.
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setIsFarmDeleteModalOpen(false);
                                setFarmToDelete(null);
                            }}
                            className="btn btn-secondary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteFarm}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete Farm
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
