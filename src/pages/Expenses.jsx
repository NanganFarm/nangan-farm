
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Trash2, Pencil, Image as ImageIcon, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal } from '../components/Modal';
import { CreatableSelect } from '../components/CreatableSelect';

export const Expenses = () => {
    const { currentFarm, currentCycle, currentZone } = useFarm();
    const { currentUser } = useAuth();
    const [expenses, setExpenses] = useState([]);



    const [stages, setStages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [zones, setZones] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingExpense, setEditingExpense] = useState(null);
    const [receiptImage, setReceiptImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sorting & Filtering State
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        zone: '',
        startDate: '',
        endDate: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        stageId: '',
        description: ''
    });

    useEffect(() => {
        if (currentFarm) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [currentFarm, currentCycle]);

    // Sync zone filter with currentZone context
    useEffect(() => {
        if (currentZone) {
            setFilters(prev => ({ ...prev, zone: currentZone.id }));
        } else {
            setFilters(prev => ({ ...prev, zone: '' }));
        }
    }, [currentZone]);

    const loadData = async () => {
        console.log("Expenses: loadData started");
        setLoading(true);

        let fetchedStages = [];
        let fetchedCategories = [];

        // 1. Load Metadata (Stages, Categories) - Robust
        try {
            [fetchedStages, fetchedCategories] = await Promise.all([
                api.getStages(),
                api.getCategories()
            ]);
            setStages(fetchedStages);
            setCategories(fetchedCategories);
            console.log("Expenses: Loaded metadata", { stages: fetchedStages.length, categories: fetchedCategories.length });

            // Set defaults if not already set
            if (fetchedStages.length > 0 && fetchedCategories.length > 0) {
                const currentStage = currentCycle ? fetchedStages.find(s => s.id === currentCycle.currentStageId) : null;
                setFormData(prev => ({
                    ...prev,
                    stageId: prev.stageId || (currentStage ? currentStage.id : fetchedStages[0].id),
                    category: prev.category || fetchedCategories[0].name
                }));
            }
        } catch (error) {
            console.error("Failed to load metadata", error);
        }

        // 2. Load Farm Data (Expenses, Zones, Cycles)
        try {
            // If we have a cycle, fetch for that cycle.
            // If no cycle (Farm View), fetch all for the farm.
            const expensePromise = currentCycle
                ? api.getExpenses(currentFarm.id, currentCycle.id)
                : api.getExpenses(currentFarm.id);

            const [expData, zoneData, cycleData] = await Promise.all([
                expensePromise,
                api.getZones(currentFarm.id),
                api.getCycles(currentFarm.id)
            ]);

            // Enrich expenses with stage names
            const enrichedExpenses = expData.map(e => {
                if (!e.stageId) return { ...e, stage: 'No Stage' };
                const stage = fetchedStages.find(s => s.id === e.stageId);
                return { ...e, stage: stage ? stage.name : 'Unknown Stage' };
            });

            // Manual sort to guarantee order: Date desc, then CreatedAt desc
            const sortedExpenses = enrichedExpenses.sort((a, b) => {
                const dateCompare = new Date(b.date) - new Date(a.date);
                if (dateCompare !== 0) return dateCompare;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            setExpenses(sortedExpenses);
            setZones(zoneData);
            setCycles(cycleData);

        } catch (error) {
            console.error("Failed to load farm data", error);
            // We don't block the UI if expenses fail, we just show empty list
        } finally {
            setLoading(false);
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setReceiptImage(compressed);
            } catch (error) {
                console.error("Error compressing image", error);
            }
        }
    };

    const handleCreateCategory = async (newCategoryName) => {
        if (!currentUser) {
            alert("You must be logged in to create a category.");
            return;
        }
        try {
            const newCategory = await api.addCategory({
                name: newCategoryName,
                userId: currentUser.id
            });
            setCategories([...categories, newCategory]);
            setFormData(prev => ({ ...prev, category: newCategory.name }));
        } catch (error) {
            console.error("Failed to create category:", error);
            alert("Failed to create category. It might already exist.");
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            date: expense.date,
            amount: expense.amount,
            category: expense.category,
            stageId: expense.stageId || '', // Ensure not null
            description: expense.description || ''
        });
        setReceiptImage(expense.receiptImage || null);
        setIsModalOpen(true);
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) return;

        try {
            if (editingExpense) {
                const updates = {
                    ...formData,
                    amount: Number(formData.amount),
                    receiptImage: receiptImage
                };
                const updatedExpense = await api.updateExpense(editingExpense.id, updates);
                setExpenses(expenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
            } else {
                if (!currentUser) {
                    alert("You must be logged in to add an expense.");
                    return;
                }
                const newExpense = {
                    ...formData,
                    amount: Number(formData.amount),
                    createdAt: new Date().toISOString(),
                    farmId: currentFarm.id,
                    cycleId: currentCycle.id,
                    zoneId: currentZone?.id || null,
                    userId: currentUser.id,
                    stageId: formData.stageId,
                    receiptImage: receiptImage
                };
                const savedExpense = await api.addExpense(newExpense);
                setExpenses([savedExpense, ...expenses]);
            }
            setIsModalOpen(false);
            setEditingExpense(null);
            setReceiptImage(null);
            setFormData(prev => ({ ...prev, amount: '', description: '' })); // Reset fields
        } catch (error) {
            console.error("Failed to save expense", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await api.deleteExpense(id);
            setExpenses(expenses.filter(e => e.id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getZoneName = (expense) => {
        if (expense.zoneId) {
            const zone = zones.find(z => z.id === expense.zoneId);
            return zone ? zone.name : 'Unknown Zone';
        }
        // Fallback: try to find via cycle
        const cycle = cycles.find(c => c.id === expense.cycleId);
        if (cycle && cycle.zoneId) {
            const zone = zones.find(z => z.id === cycle.zoneId);
            return zone ? zone.name : 'Unknown Zone';
        }
        return 'General Farm';
    };

    const sortedAndFilteredExpenses = React.useMemo(() => {
        let result = [...expenses];

        // Filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(e =>
                (e.description && e.description.toLowerCase().includes(searchLower)) ||
                e.category.toLowerCase().includes(searchLower) ||
                e.stage.toLowerCase().includes(searchLower)
            );
        }
        if (filters.category) {
            result = result.filter(e => e.category === filters.category);
        }
        if (filters.zone) {
            // Filter by zoneId directly or via cycle's zoneId
            result = result.filter(e => {
                if (e.zoneId) return e.zoneId === filters.zone;
                const cycle = cycles.find(c => c.id === e.cycleId);
                return cycle && cycle.zoneId === filters.zone;
            });
        }
        if (filters.startDate) {
            result = result.filter(e => e.date >= filters.startDate);
        }
        if (filters.endDate) {
            result = result.filter(e => e.date <= filters.endDate);
        }

        // Sort
        result.sort((a, b) => {
            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'asc'
                    ? Number(a.amount) - Number(b.amount)
                    : Number(b.amount) - Number(a.amount);
            }

            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [expenses, filters, sortConfig]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-emerald-600" />
            : <ArrowDown size={14} className="text-emerald-600" />;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading expenses...</div>;

    if (!currentFarm) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                    <Filter size={48} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Farm Selected</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    Please create or select a farm to view expenses.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {currentCycle ? 'Manage expenses for this cycle.' : 'Viewing all expenses across the farm.'}
                    </p>
                </div>
                {currentCycle && (
                    <button
                        onClick={() => {
                            setFormData({
                                date: new Date().toISOString().split('T')[0],
                                amount: '',
                                category: formData.category || (categories.length > 0 ? categories[0].name : ''),
                                stageId: currentCycle.currentStageId || '',
                                description: ''
                            });
                            setIsModalOpen(true);
                        }}
                        className="btn btn-primary shadow-lg shadow-emerald-900/20"
                    >
                        <Plus size={18} />
                        Add Expense
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-gray-900 dark:text-white"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-gray-900 dark:text-white min-w-[140px] flex-shrink-0"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    {!currentCycle && (
                        <select
                            value={filters.zone}
                            onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-gray-900 dark:text-white min-w-[140px] flex-shrink-0"
                        >
                            <option value="">All Zones</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    )}
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-gray-900 dark:text-white flex-shrink-0"
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-gray-900 dark:text-white flex-shrink-0"
                        placeholder="End Date"
                    />
                    {(filters.search || filters.category || filters.zone || filters.startDate || filters.endDate) && (
                        <button
                            onClick={() => setFilters({ search: '', category: '', zone: '', startDate: '', endDate: '' })}
                            className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : sortedAndFilteredExpenses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No expenses match your filters.</div>
                ) : (
                    sortedAndFilteredExpenses.map((expense) => (
                        <div key={expense.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                            <div className="flex justify-between items-start mb-2 gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                                    <h4 className="font-medium text-gray-900 dark:text-white mt-1 break-words">{expense.description || '-'}</h4>
                                </div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">
                                    ₱{Number(expense.amount).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    {expense.category}
                                </span>
                                {!currentCycle && (
                                    <>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                            {getZoneName(expense)}
                                        </span>
                                    </>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{expense.stage}</span>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                                <button
                                    onClick={() => handleEdit(expense)}
                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-2">Date <SortIcon columnKey="date" /></div>
                                </th>
                                {!currentCycle && <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Zone</th>}
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('description')}>
                                    <div className="flex items-center gap-2">Description <SortIcon columnKey="description" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-2">Category <SortIcon columnKey="category" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('stage')}>
                                    <div className="flex items-center gap-2">Stage <SortIcon columnKey="stage" /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center justify-end gap-2">Amount <SortIcon columnKey="amount" /></div>
                                </th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : sortedAndFilteredExpenses.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No expenses match your filters.</td></tr>
                            ) : (
                                sortedAndFilteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(expense.date).toLocaleDateString()}</td>
                                        {!currentCycle && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {getZoneName(expense)}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{expense.description || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{expense.stage}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                                            ₱{Number(expense.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(expense)}
                                                className="text-gray-400 hover:text-emerald-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                    setReceiptImage(null);
                    setFormData(prev => ({ ...prev, amount: '', description: '' }));
                }}
                title={editingExpense ? "Edit Expense" : "New Expense"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Photo</label>
                        <div className="mt-1 flex items-center gap-4">
                            {receiptImage && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                    <img src={receiptImage} alt="Receipt preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setReceiptImage(null)}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <label className="cursor-pointer btn btn-secondary dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 text-sm">
                                <ImageIcon size={16} />
                                {receiptImage ? 'Change Photo' : 'Upload Photo'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <CreatableSelect
                            options={categories.map(c => ({ label: c.name, value: c.name }))}
                            value={formData.category}
                            onChange={(value) => setFormData({ ...formData, category: value })}
                            onCreate={handleCreateCategory}
                            placeholder="Select or create category..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₱)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stage</label>
                        <select
                            value={formData.stageId}
                            onChange={e => setFormData({ ...formData, stageId: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select Stage (Optional)</option>
                            {stages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                        <textarea
                            rows="3"
                            placeholder="Details about this expense..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none dark:bg-gray-700 dark:text-white"
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
                            className="btn btn-primary"
                        >
                            Save Expense
                        </button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

