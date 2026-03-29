import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Star,
  ShieldAlert
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, PrioritizedTask, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { sortTasksByPriority } from '../lib/priority-logic';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function SmartFocus() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('status', '==', 'pending')
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

  const prioritizedTasks = sortTasksByPriority(tasks);
  const urgentTasks = prioritizedTasks.filter(t => t.category === 'urgent');
  const importantTasks = prioritizedTasks.filter(t => t.category === 'important');
  const normalTasks = prioritizedTasks.filter(t => t.category === 'normal');

  const nextTask = prioritizedTasks[0];

  const toggleStatus = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'completed'
      });
      
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-zinc-900">Smart Focus</h1>
        <p className="text-zinc-500 text-lg">Intelligent prioritization to help you focus on what matters.</p>
      </div>

      {/* Next Task Suggestion */}
      {nextTask && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 fill-white" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recommended Next Task</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-6 leading-tight">
              {nextTask.title}
            </h2>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2 text-sm font-bold">
                <Clock className="w-4 h-4" />
                {nextTask.deadline ? format(new Date(nextTask.deadline), 'MMM d, h:mm a') : 'No deadline'}
              </div>
              <div className="px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2 text-sm font-bold capitalize">
                <Zap className="w-4 h-4" />
                {nextTask.category} Priority
              </div>
            </div>
            <button 
              onClick={() => toggleStatus(nextTask)}
              className="px-8 py-4 bg-white text-zinc-900 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-white/10"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark as Completed
            </button>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
        </motion.div>
      )}

      {/* Prioritized Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Urgent Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <h3 className="text-xl font-bold text-zinc-900">Urgent</h3>
            <span className="ml-auto text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg shadow-sm">{urgentTasks.length}</span>
          </div>
          <div className="space-y-4">
            {urgentTasks.map(task => (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-zinc-200 p-5 rounded-3xl group hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h4 className="font-bold text-zinc-900 leading-tight transition-colors">
                    {task.title}
                  </h4>
                  <button 
                    onClick={() => toggleStatus(task)}
                    className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {task.deadline ? format(new Date(task.deadline), 'MMM d') : 'No date'}
                  </div>
                  <span className="text-zinc-200">•</span>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    Score: {task.score}
                  </div>
                </div>
              </motion.div>
            ))}
            {urgentTasks.length === 0 && (
              <div className="p-8 border border-dashed border-zinc-200 rounded-3xl text-center bg-zinc-50/50">
                <p className="text-zinc-400 text-sm font-medium">No urgent tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Important Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <h3 className="text-xl font-bold text-zinc-900">Important</h3>
            <span className="ml-auto text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg shadow-sm">{importantTasks.length}</span>
          </div>
          <div className="space-y-4">
            {importantTasks.map(task => (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-zinc-200 p-5 rounded-3xl group hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h4 className="font-bold text-zinc-900 leading-tight transition-colors">
                    {task.title}
                  </h4>
                  <button 
                    onClick={() => toggleStatus(task)}
                    className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {task.deadline ? format(new Date(task.deadline), 'MMM d') : 'No date'}
                  </div>
                  <span className="text-zinc-200">•</span>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    Score: {task.score}
                  </div>
                </div>
              </motion.div>
            ))}
            {importantTasks.length === 0 && (
              <div className="p-8 border border-dashed border-zinc-200 rounded-3xl text-center bg-zinc-50/50">
                <p className="text-zinc-400 text-sm font-medium">No important tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Normal Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <h3 className="text-xl font-bold text-zinc-900">Normal</h3>
            <span className="ml-auto text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-lg shadow-sm">{normalTasks.length}</span>
          </div>
          <div className="space-y-4">
            {normalTasks.map(task => (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-zinc-200 p-5 rounded-3xl group hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h4 className="font-bold text-zinc-900 leading-tight transition-colors">
                    {task.title}
                  </h4>
                  <button 
                    onClick={() => toggleStatus(task)}
                    className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {task.deadline ? format(new Date(task.deadline), 'MMM d') : 'No date'}
                  </div>
                  <span className="text-zinc-200">•</span>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    Score: {task.score}
                  </div>
                </div>
              </motion.div>
            ))}
            {normalTasks.length === 0 && (
              <div className="p-8 border border-dashed border-zinc-200 rounded-3xl text-center bg-zinc-50/50">
                <p className="text-zinc-400 text-sm font-medium">No normal tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
