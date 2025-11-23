
import React, { useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, Clock, Flame, TrendingUp, Bot, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { translations } from '../lib/translations';

const MetricCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user, tasks, subjects, sessions, toggleTaskComplete, setView, dashboardInsight, fetchDashboardInsight } = useStore();
  const t = translations[user?.preferences?.language || 'en'] || translations['en'];

  useEffect(() => {
      fetchDashboardInsight();
  }, []);

  const upcomingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  const completedTasks = tasks.filter(t => t.completed).length;
  
  // Calculate productivity score
  const productivityScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.min(100, Math.round((completedTasks / tasks.length) * 100));
  }, [tasks, completedTasks]);

  // Calculate total study time with proper formatting
  const totalStudyTime = useMemo(() => {
    const minutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t.dashboard.welcome} {user?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t.dashboard.tasksDue.replace('{count}', upcomingTasks.length.toString())}
          </p>
        </div>
        <button 
          onClick={() => setView('pomodoro')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2"
        >
          <Clock size={18} />
          {t.dashboard.startSession}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={CheckCircle2} 
          label={t.dashboard.metrics.tasksCompleted} 
          value={completedTasks} 
          trend={tasks.length > 0 ? `${productivityScore}% done` : ''}
          color="bg-blue-500" 
        />
        <MetricCard 
          icon={Clock} 
          label={t.dashboard.metrics.studyHours} 
          value={totalStudyTime} 
          trend="Total"
          color="bg-purple-500" 
        />
        <MetricCard 
          icon={Flame} 
          label={t.dashboard.metrics.streak} 
          value={user?.streak || 0} 
          trend="Keep it up!" 
          color="bg-orange-500" 
        />
        <MetricCard 
          icon={TrendingUp} 
          label={t.dashboard.metrics.focusScore} 
          value={`${productivityScore}%`} 
          color="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Up Next */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.dashboard.upNext}</h2>
            <button 
              onClick={() => setView('subjects')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          
          <div className="space-y-4">
            {upcomingTasks.length > 0 ? upcomingTasks.map(task => {
              const subject = subjects.find(s => s.id === task.subject_id);
              return (
                <div key={task.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                  <button 
                    onClick={() => toggleTaskComplete(task.id)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500 mr-4 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center transition-colors"
                  >
                    {task.completed && <div className="w-3 h-3 bg-primary-500 rounded-full" />}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 gap-2">
                      {subject && (
                        <span 
                          className="px-2 py-0.5 rounded-md text-white" 
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    task.priority === 'high' 
                      ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                      : task.priority === 'medium'
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  }`}>
                    {t.subjects.priority[task.priority] || task.priority}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12 text-gray-400">
                <p>{t.dashboard.noTasks}</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-6 text-white shadow-lg flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg animate-pulse">
              <Bot size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-lg">{t.dashboard.aiInsight}</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
             {dashboardInsight ? (
                <p className="text-white/95 text-sm leading-relaxed mb-4 font-medium tracking-wide">
                  "{dashboardInsight}"
                </p>
             ) : (
                <div className="flex items-center gap-2 text-white/80 mb-4">
                   <Loader2 size={16} className="animate-spin" />
                   <span className="text-sm">{t.chat.generating}</span>
                </div>
             )}
          </div>

          <button 
            onClick={() => setView('ai-tutor')}
            className="w-full bg-white text-primary-600 font-semibold py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors mt-auto"
          >
            {t.dashboard.chatTutor}
          </button>
        </div>
      </div>
    </div>
  );
};
