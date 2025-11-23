
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { translations } from '../lib/translations';

// Helper to safely translate days without relying on external locale imports
const translateDay = (day: string, lang: string | undefined) => {
  if (lang !== 'es') return day;
  
  const map: Record<string, string> = {
    // Short
    'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue', 'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom',
    // Long
    'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles', 'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
  };
  
  return map[day] || day;
};

// Native date helpers to replace date-fns missing exports
const parseDate = (dateStr: string | Date | number): Date => {
    if (dateStr instanceof Date) return dateStr;
    return new Date(dateStr);
};

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getSunday = (d: Date) => {
    const monday = getMonday(d);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
};

const getDaysArray = (start: Date, end: Date) => {
    const arr = [];
    const dt = new Date(start);
    while (dt <= end) {
        arr.push(new Date(dt));
        dt.setDate(dt.getDate() + 1);
    }
    return arr;
};

const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

export const Analytics: React.FC = () => {
  const { sessions, subjects, tasks, user } = useStore();
  const t = translations[user?.preferences?.language || 'en'] || translations['en'];
  const lang = user?.preferences?.language || 'en';

  // 1. Calculate Weekly Activity (Real Data)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const start = getMonday(today);
    const end = getSunday(today);
    const days = getDaysArray(start, end);

    return days.map(day => {
      const daySessions = sessions.filter(s => {
        const sessionDate = parseDate(s.started_at);
        return isSameDate(sessionDate, day);
      });

      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      const dayName = format(day, 'EEE');
      
      return {
        day: translateDay(dayName, lang),
        // Increased precision to 2 decimals so small sessions show up
        hours: Math.round((totalMinutes / 60) * 100) / 100 
      };
    });
  }, [sessions, lang]);

  // 2. Calculate Subject Data
  const subjectData = useMemo(() => {
    if (subjects.length === 0) return [];
    
    const data = subjects.map(sub => {
      const duration = sessions
        .filter(s => s.subject_id === sub.id)
        .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
      
      return {
        name: sub.name.length > 8 ? sub.name.substring(0, 8) + '..' : sub.name,
        fullName: sub.name,
        // Increased precision
        hours: Math.round((duration / 60) * 100) / 100,
        fill: sub.color
      };
    });

    return data;

  }, [subjects, sessions]);

  // 3. Calculate Summary Stats
  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    
    // Format Total Hours nicely (e.g., "1h 30m")
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const totalHours = m > 0 ? `${h}h ${m}m` : `${h}h`;

    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Best Day Calculation
    const dayCounts: Record<string, number> = {};
    sessions.forEach(s => {
       const date = parseDate(s.started_at);
       const dayName = format(date, 'EEEE'); // Full name: Monday
       dayCounts[dayName] = (dayCounts[dayName] || 0) + s.duration_minutes;
    });
    const sortedDays = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]);
    const bestDayRaw = sortedDays.length > 0 ? sortedDays[0][0] : '-';
    const bestDay = translateDay(bestDayRaw, lang);

    // Best Time Calculation
    const hourCounts: Record<number, number> = {};
    sessions.forEach(s => {
       const date = parseDate(s.started_at);
       const hour = date.getHours();
       hourCounts[hour] = (hourCounts[hour] || 0) + s.duration_minutes;
    });
    const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    let bestTimeStr = '-';
    if (sortedHours.length > 0) {
      const hour = parseInt(sortedHours[0][0]);
      const d = new Date();
      d.setHours(hour);
      d.setMinutes(0);
      bestTimeStr = format(d, 'h a');
    }

    return { totalHours, completionRate, bestDay, bestTimeStr };
  }, [sessions, tasks, lang]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Format tooltip values to be readable (e.g. 0.17 hrs -> 10 mins)
      const val = payload[0].value;
      const mins = Math.round(val * 60);
      const display = mins < 60 ? `${mins} min` : `${val} hrs`;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg">
          <p className="text-sm font-medium dark:text-white">{`${label} : ${display}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.analytics.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">{t.analytics.weeklyActivity}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#9ca3af" 
                  tick={{fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#0d9488', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#0d9488" 
                  strokeWidth={3} 
                  dot={{ fill: '#fff', stroke: '#0d9488', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#0d9488', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">{t.analytics.hoursBySubject}</h3>
           <div className="h-[300px] w-full">
            {subjectData.length > 0 && subjectData.some(d => d.hours > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical" margin={{left: 20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" tick={{fontSize: 12}} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#9ca3af" 
                    tick={{fontSize: 12}} 
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        const mins = Math.round(val * 60);
                        const display = mins < 60 ? `${mins} min` : `${val} hrs`;
                        return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg">
                            <p className="text-sm font-bold" style={{color: payload[0].payload.fill}}>{payload[0].payload.fullName}</p>
                            <p className="text-sm dark:text-gray-300">{display}</p>
                            </div>
                        );
                        }
                        return null;
                    }}
                   />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f1f5f9', radius: [0, 4, 4, 0] }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <p>{t.analytics.noData}</p>
                <p className="text-xs mt-1">{t.analytics.startFocus}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">{t.analytics.totalHours}</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">{stats.totalHours}</p>
         </div>
         <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold tracking-wider">{t.analytics.completion}</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">{stats.completionRate}%</p>
         </div>
         <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 uppercase font-bold tracking-wider">{t.analytics.bestDay}</p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200 mt-1 truncate">{stats.bestDay}</p>
         </div>
         <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold tracking-wider">{t.analytics.bestTime}</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200 mt-1">{stats.bestTimeStr}</p>
         </div>
      </div>
    </div>
  );
};
