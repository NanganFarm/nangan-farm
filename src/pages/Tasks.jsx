import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';
import { Modal } from '../components/Modal';
import { Plus, Calendar as CalendarIcon, List, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import clsx from 'clsx';

const TaskCalendar = ({ tasks, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getDayTasks = (day) => {
        return tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Task Calendar</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        &lt;
                    </button>
                    <span className="font-medium text-gray-700 dark:text-gray-200 min-w-[120px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        &gt;
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-gray-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                    const dayTasks = getDayTasks(day);
                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateClick(day)}
                            className={clsx(
                                "min-h-[80px] p-2 rounded-lg border transition-colors cursor-pointer hover:border-primary-500",
                                isToday(day) ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                            )}
                        >
                            <div className="text-right text-xs mb-1 text-gray-500">{format(day, 'd')}</div>
                            <div className="space-y-1">
                                {dayTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className={clsx(
                                        "text-[10px] px-1 py-0.5 rounded truncate",
                                        task.status === 'completed' ? "bg-gray-100 text-gray-500 line-through" :
                                            task.priority === 'high' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                                    )}>
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className="text-[10px] text-gray-400 text-center">+{dayTasks.length - 3} more</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const Tasks = () => {
    const { currentFarm, currentZone } = useFarm();
    const [tasks, setTasks] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'calendar'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        zoneId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentFarm) {
            loadTasks();
        }
    }, [currentFarm]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await api.getTasks(currentFarm.id);
            setTasks(data);
        } catch (error) {
            console.error("Failed to load tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.addTask({
                ...newTask,
                farmId: currentFarm.id,
                userId: currentFarm.user_id
            });
            setIsModalOpen(false);
            setNewTask({ title: '', description: '', dueDate: '', priority: 'medium', zoneId: '' });
            loadTasks();
        } catch (error) {
            alert("Failed to add task: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await api.updateTask(task.id, { status: newStatus });
            loadTasks();
        } catch (error) {
            console.error("Failed to update task:", error);
        }
    };

    const deleteTask = async (id) => {
        if (!confirm("Delete this task?")) return;
        try {
            await api.deleteTask(id);
            loadTasks();
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const filteredTasks = tasks.filter(t => !currentZone || t.zoneId === currentZone.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage farm operations and schedules.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setView('list')}
                            className={clsx("p-2 rounded-md transition-colors", view === 'list' ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700")}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={clsx("p-2 rounded-md transition-colors", view === 'calendar' ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700")}
                        >
                            <CalendarIcon size={20} />
                        </button>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary-900/20">
                        <Plus size={20} /> New Task
                    </button>
                </div>
            </div>

            {view === 'list' ? (
                <div className="card overflow-hidden">
                    {filteredTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No tasks found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTasks.map(task => (
                                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleStatus(task)}
                                            className={clsx(
                                                "mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                task.status === 'completed' ? "bg-primary-500 border-primary-500 text-white" : "border-gray-300 text-transparent hover:border-primary-500"
                                            )}
                                        >
                                            <CheckCircle2 size={14} />
                                        </button>
                                        <div>
                                            <h4 className={clsx("font-medium", task.status === 'completed' && "text-gray-400 line-through")}>
                                                {task.title}
                                            </h4>
                                            <p className="text-sm text-gray-500">{task.description}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {task.zoneName && (
                                                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                                        {task.zoneName}
                                                    </span>
                                                )}
                                                <span className={clsx(
                                                    "px-1.5 py-0.5 rounded capitalize",
                                                    task.priority === 'high' ? "bg-red-100 text-red-700" :
                                                        task.priority === 'medium' ? "bg-accent-100 text-accent-700" :
                                                            "bg-slate-100 text-slate-700"
                                                )}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <TaskCalendar tasks={filteredTasks} onDateClick={(date) => {
                    setNewTask(prev => ({ ...prev, dueDate: format(date, 'yyyy-MM-dd') }));
                    setIsModalOpen(true);
                }} />
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
                <form onSubmit={handleAddTask} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            rows="3"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={newTask.dueDate}
                                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                value={newTask.priority}
                                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary flex items-center gap-2">
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
