import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertCircle,
  X,
  Edit2,
  CheckSquare,
  Timer
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, Priority, Status, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function TaskManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const taskData = {
      userId: user.uid,
      title,
      description,
      priority,
      deadline: deadline || null,
      estimatedTime: estimatedTime && !isNaN(parseInt(estimatedTime)) ? parseInt(estimatedTime) : 0,
      status: editingTask ? editingTask.status : 'pending' as Status,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString()
    };

    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
      } else {
        await addDoc(collection(db, 'tasks'), taskData);
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tasks');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDeadline('');
    setEstimatedTime('');
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : '');
    setEstimatedTime(task.estimatedTime?.toString() || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskToDelete));
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      toast.success('Task deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'tasks');
    }
  };

  const toggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus
      });
      
      if (newStatus === 'completed') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
        toast.success('Task completed! Great job! 🎉', {
          description: `You've finished: ${task.title}`,
          duration: 4000,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-zinc-900">Task Manager</h1>
          <p className="text-zinc-500 text-lg">Organize and prioritize your study goals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10"
        >
          <Plus className="w-5 h-5" />
          Add New Task
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-zinc-900 placeholder:text-zinc-400 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'medium', 'high'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-bold capitalize transition-all",
                filterPriority === p 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md" 
                  : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 shadow-sm"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "group relative bg-white border p-6 rounded-3xl transition-all hover:shadow-xl hover:shadow-zinc-200/50",
                task.status === 'completed' ? "border-emerald-500/20 bg-emerald-50/30" : "border-zinc-200 shadow-sm"
              )}
            >
              <div className="flex items-start gap-6">
                <button 
                  onClick={() => toggleStatus(task)}
                  className={cn(
                    "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    task.status === 'completed' 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-zinc-200 hover:border-zinc-400"
                  )}
                >
                  {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={cn(
                      "text-xl font-bold truncate text-zinc-900",
                      task.status === 'completed' && "line-through text-zinc-400"
                    )}>
                      {task.title}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-zinc-500 text-sm mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-400">
                    {task.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.deadline), 'MMM d, h:mm a')}
                      </div>
                    )}
                    {task.estimatedTime > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Est: {task.estimatedTime}m
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(task)}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-2 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && !loading && (
          <div className="text-center py-20 bg-white border border-dashed border-zinc-200 rounded-3xl">
            <CheckSquare className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-zinc-400">No tasks found</h3>
            <p className="text-zinc-500">Try adjusting your filters or add a new task.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                  <button onClick={resetForm} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Title</label>
                    <input 
                      required
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add some details..."
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all resize-none text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Priority</label>
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all appearance-none text-zinc-900"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estimated Time (min)</label>
                      <input 
                        type="number" 
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        placeholder="e.g. 60"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-zinc-900 placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Deadline</label>
                    <input 
                      type="datetime-local" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-zinc-900"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] mt-4 shadow-lg shadow-zinc-900/10"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Delete Task?</h3>
              <p className="text-zinc-500 mb-8">This action cannot be undone. Are you sure you want to remove this task?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="py-3 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
