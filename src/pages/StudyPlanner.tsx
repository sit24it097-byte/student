import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { sortTasksByPriority } from '../lib/priority-logic';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { cn } from '../lib/utils';

export default function StudyPlanner() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => task.deadline && isSameDay(new Date(task.deadline), day));
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-zinc-900">Study Planner</h1>
          <p className="text-zinc-500 text-lg">Visualize your deadlines and plan your sessions.</p>
        </div>
        <div className="flex items-center gap-4 bg-white border border-zinc-200 p-2 rounded-2xl shadow-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold min-w-[140px] text-center text-zinc-900">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-xl shadow-zinc-200/50">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div 
                key={day.toString()}
                className={cn(
                  "min-h-[140px] p-4 border-r border-b border-zinc-100 transition-colors group hover:bg-zinc-50/50",
                  !isCurrentMonth && "bg-zinc-50/30",
                  (i + 1) % 7 === 0 && "border-r-0"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all",
                    isTodayDay ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 scale-110" : "text-zinc-400 group-hover:text-zinc-900",
                    !isCurrentMonth && "opacity-20"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">
                      {dayTasks.length} {dayTasks.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {sortTasksByPriority(dayTasks).slice(0, 3).map((task) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[10px] font-bold truncate border shadow-sm",
                        task.status === 'completed' 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                          : task.category === 'urgent' 
                            ? "bg-rose-50 border-rose-100 text-rose-600"
                            : task.category === 'important'
                              ? "bg-amber-50 border-amber-100 text-amber-600"
                              : "bg-zinc-50 border-zinc-100 text-zinc-600"
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] font-black text-zinc-300 pl-2 tracking-widest">
                      + {dayTasks.length - 3} MORE
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          Urgent
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          Important
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          Completed
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-sm shadow-zinc-900/50" />
          Today
        </div>
      </div>
    </div>
  );
}
