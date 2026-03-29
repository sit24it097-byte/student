import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  CheckCircle2,
  Zap,
  Target,
  Clock,
  CheckSquare,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { sortTasksByPriority } from '../lib/priority-logic';
import { format, isBefore } from 'date-fns';
import { cn } from '../lib/utils';

export default function Reports() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

    return () => unsubTasks();
  }, [user]);

  const prioritizedTasks = sortTasksByPriority(tasks.filter(t => t.status === 'pending'));
  const urgentTasks = prioritizedTasks.filter(t => t.category === 'urgent');
  const importantTasks = prioritizedTasks.filter(t => t.category === 'important');

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.status === 'pending' && t.deadline && isBefore(new Date(t.deadline), new Date())).length,
    urgent: urgentTasks.length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
  };

  // Data for Priority Distribution
  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f43f5e' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Data for Urgency Categories
  const urgencyData = [
    { name: 'Urgent', value: prioritizedTasks.filter(t => t.category === 'urgent').length, color: '#f43f5e' },
    { name: 'Important', value: prioritizedTasks.filter(t => t.category === 'important').length, color: '#f59e0b' },
    { name: 'Normal', value: prioritizedTasks.filter(t => t.category === 'normal').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

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
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-zinc-900">Reports & Analytics</h1>
        <p className="text-zinc-500 text-lg">Detailed insights into your task prioritization and completion.</p>
      </div>

      {/* Urgent Warning */}
      {stats.urgent > 0 && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center gap-6 shadow-sm"
        >
          <div className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-rose-600 font-bold text-lg">You have {stats.urgent} urgent tasks pending!</p>
            <p className="text-rose-600/70 font-medium">Complete them before the deadlines to stay on track.</p>
          </div>
          <Link to="/focus" className="px-6 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/20">
            Focus Now
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Urgent', value: stats.urgent, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-zinc-200 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="text-3xl font-black text-zinc-900">{stat.value}</span>
            </div>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Focus Now Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white border border-zinc-200 p-8 rounded-[40px] relative overflow-hidden group shadow-sm"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Target className="w-6 h-6 text-zinc-900" />
              <h2 className="text-2xl font-bold text-zinc-900">Tasks to Focus Now</h2>
            </div>
            
            <div className="space-y-4">
              {prioritizedTasks.slice(0, 3).map((task, i) => (
                <div key={task.id} className="bg-zinc-50/50 p-5 rounded-3xl border border-zinc-100 flex items-center gap-5 group/item hover:border-zinc-200 hover:bg-white hover:shadow-lg hover:shadow-zinc-100 transition-all">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm",
                    task.category === 'urgent' ? 'bg-rose-100 text-rose-600' : 
                    task.category === 'important' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-zinc-900 truncate">{task.title}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      <span className="capitalize">{task.category}</span>
                      <span className="text-zinc-200">•</span>
                      <span>{task.deadline ? format(new Date(task.deadline), 'MMM d, h:mm a') : 'No deadline'}</span>
                    </div>
                  </div>
                  <Link to="/focus" className="p-3 bg-white border border-zinc-200 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all hover:bg-zinc-900 hover:text-white shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ))}
              {prioritizedTasks.length === 0 && (
                <div className="text-center py-12 bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200">
                  <CheckCircle2 className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-400 font-medium">All caught up! No pending tasks.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-zinc-100/30 rounded-full blur-3xl group-hover:bg-zinc-100/50 transition-colors" />
        </motion.div>

        {/* Top Priority Summary */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-zinc-200 p-8 rounded-[40px] flex flex-col shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-zinc-900">Top Priority</h2>
            <Link to="/focus" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <Zap className="w-5 h-5" />
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm">
              <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2">Urgent Tasks</p>
              <p className="text-4xl font-black text-rose-600">{stats.urgent}</p>
            </div>
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm">
              <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2">Important Tasks</p>
              <p className="text-4xl font-black text-amber-600">{importantTasks.length}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm">
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Completion Rate</p>
              <p className="text-4xl font-black text-emerald-600">{stats.completionRate}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Distribution */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-6 h-6 text-zinc-900" />
            <h2 className="text-2xl font-bold text-zinc-900">Priority Distribution</h2>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Urgency Distribution */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-6 h-6 text-zinc-900" />
            <h2 className="text-2xl font-bold text-zinc-900">Urgency Analysis</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" name="Tasks" radius={[8, 8, 0, 0]} barSize={40}>
                  {urgencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
