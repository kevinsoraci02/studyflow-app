
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Calendar, BookOpen, Pencil, X, AlignLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Subject, Task, Priority } from '../types';
import { format } from 'date-fns';
import { translations } from '../lib/translations';

export const SubjectManager: React.FC = () => {
  const { 
    subjects, 
    tasks, 
    addSubject, 
    updateSubject, 
    deleteSubject,
    addTask, 
    updateTask,
    deleteTask,
    toggleTaskComplete,
    user
  } = useStore();

  const t = translations[user?.preferences?.language || 'en'] || translations['en'];

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Expanded task notes state
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Form States
  const [subjectForm, setSubjectForm] = useState({ name: '', color: '#3b82f6', credits: 3 });
  const [taskForm, setTaskForm] = useState({ title: '', subject_id: '', due_date: '', priority: Priority.MEDIUM, notes: '' });

  // --- Subject Handlers ---

  const openAddSubject = () => {
    setEditingSubjectId(null);
    setSubjectForm({ name: '', color: '#3b82f6', credits: 3 });
    setShowAddSubject(true);
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setSubjectForm({ name: subject.name, color: subject.color, credits: subject.credits });
    setShowAddSubject(true);
  };

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubjectId) {
      updateSubject(editingSubjectId, {
        name: subjectForm.name,
        color: subjectForm.color,
        credits: subjectForm.credits
      });
    } else {
      addSubject({
        name: subjectForm.name,
        color: subjectForm.color,
        credits: subjectForm.credits,
        professor: ''
      });
    }
    setShowAddSubject(false);
    setEditingSubjectId(null);
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm(t.subjects.deleteConfirm)) {
      deleteSubject(id);
    }
  };

  // --- Task Handlers ---

  const openAddTask = () => {
    setEditingTaskId(null);
    const today = format(new Date(), 'yyyy-MM-dd');
    setTaskForm({ title: '', subject_id: '', due_date: today, priority: Priority.MEDIUM, notes: '' });
    setShowAddTask(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    const dateStr = task.due_date.split('T')[0]; 
    setTaskForm({ 
      title: task.title, 
      subject_id: task.subject_id || '', 
      due_date: dateStr, 
      priority: task.priority,
      notes: task.notes || ''
    });
    setShowAddTask(true);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: taskForm.title,
        subject_id: taskForm.subject_id,
        due_date: taskForm.due_date,
        priority: taskForm.priority,
        notes: taskForm.notes
      });
    } else {
      addTask({
        title: taskForm.title,
        subject_id: taskForm.subject_id,
        due_date: taskForm.due_date,
        priority: taskForm.priority,
        notes: taskForm.notes,
        completed: false,
        estimated_hours: 1
      });
    }
    setShowAddTask(false);
    setEditingTaskId(null);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm(t.subjects.deleteTaskConfirm)) {
      deleteTask(id);
    }
  };

  const toggleTaskExpansion = (id: string) => {
    const newSet = new Set(expandedTaskIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTaskIds(newSet);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full pb-20 md:pb-0">
      
      {/* Left Col: Subjects List */}
      <div className="lg:col-span-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.subjects.title}</h2>
          <button 
            onClick={openAddSubject}
            className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 transition-colors"
            title={t.subjects.newSubject}
          >
            <Plus size={20} />
          </button>
        </div>

        {showAddSubject && (
          <form onSubmit={handleSubjectSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{editingSubjectId ? t.subjects.editSubject : t.subjects.newSubject}</h3>
              <button type="button" onClick={() => setShowAddSubject(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            <input 
              type="text" 
              placeholder={t.subjects.namePlaceholder} 
              required
              className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              value={subjectForm.name}
              onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
            />
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder={t.subjects.credits}
                className="w-20 p-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={subjectForm.credits}
                onChange={e => setSubjectForm({...subjectForm, credits: parseInt(e.target.value)})}
              />
              <div className="relative flex-1">
                <input 
                  type="color"
                  className="w-full h-9 rounded cursor-pointer border border-gray-200 bg-white p-1"
                  value={subjectForm.color}
                  onChange={e => setSubjectForm({...subjectForm, color: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="submit" className="text-xs px-3 py-2 bg-primary-600 text-white rounded-lg font-medium">
                {editingSubjectId ? t.subjects.update : t.subjects.create}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {subjects.map(subject => (
            <div key={subject.id} className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all" style={{ borderLeftColor: subject.color }}>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                <p className="text-xs text-gray-500">{subject.credits} {t.subjects.credits}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openEditSubject(subject)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {subjects.length === 0 && !showAddSubject && (
             <div className="text-center p-4 text-gray-500 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                {t.subjects.noSubjects}
             </div>
          )}
        </div>
      </div>

      {/* Right Col: Tasks */}
      <div className="lg:col-span-2 space-y-6">
         <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.subjects.assignmentsTitle}</h2>
          <button 
            onClick={openAddTask}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            {t.subjects.newTask}
          </button>
        </div>

        {showAddTask && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 animate-in fade-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">{editingTaskId ? t.subjects.editTask : t.subjects.newTask}</h3>
                <button onClick={() => setShowAddTask(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             <form onSubmit={handleTaskSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{t.subjects.taskTitle}</label>
                   <input 
                    type="text" 
                    placeholder={t.subjects.taskTitle}
                    required
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={taskForm.title}
                    onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{t.subjects.selectSubject}</label>
                   <select 
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={taskForm.subject_id}
                    onChange={e => setTaskForm({...taskForm, subject_id: e.target.value})}
                    required
                   >
                      <option value="" disabled>{t.subjects.selectSubject}</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{t.subjects.priority.label}</label>
                   <select 
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value as Priority})}
                   >
                      <option value="low">{t.subjects.priority.low}</option>
                      <option value="medium">{t.subjects.priority.medium}</option>
                      <option value="high">{t.subjects.priority.high}</option>
                   </select>
                </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Due Date</label>
                   <input 
                    type="date" 
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{t.subjects.taskNotes}</label>
                   <textarea 
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none h-24"
                    value={taskForm.notes}
                    onChange={e => setTaskForm({...taskForm, notes: e.target.value})}
                    placeholder="..."
                   />
                </div>

                <div className="col-span-2 flex justify-end gap-3 mt-2">
                  <button type="button" onClick={() => setShowAddTask(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{t.subjects.cancel}</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                    {editingTaskId ? t.subjects.updateTask : t.subjects.createTask}
                  </button>
                </div>
             </form>
          </div>
        )}

        <div className="space-y-2">
           {tasks.length === 0 ? (
             <div className="text-center py-10 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
               <BookOpen className="mx-auto mb-2 opacity-50" size={32} />
               <p>{t.subjects.noTasks}</p>
             </div>
           ) : tasks.map(task => {
             const subject = subjects.find(s => s.id === task.subject_id);
             const isExpanded = expandedTaskIds.has(task.id);
             
             return (
               <div 
                key={task.id} 
                className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all overflow-hidden ${task.completed ? 'opacity-60' : ''}`}
               >
                  <div className="flex items-center p-4">
                      <button 
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
                          task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 dark:border-gray-500 hover:border-primary-500'
                        }`}
                      >
                        {task.completed && <Plus size={14} className="transform rotate-45" />}
                      </button>
                      
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium text-gray-900 dark:text-white truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          {task.notes && (
                              <AlignLeft size={14} className="text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex gap-3 mt-1 text-xs text-gray-500 items-center">
                          {subject && <span style={{color: subject.color}} className="font-medium">{subject.name}</span>}
                          <span className="flex items-center gap-1">
                              <Calendar size={12} /> 
                              {format(new Date(task.due_date.split('T')[0] + 'T12:00:00'), 'MMM d')}
                            </span>
                          <div className={`px-2 py-0.5 text-[10px] uppercase rounded font-bold ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {t.subjects.priority[task.priority] || task.priority}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 items-center">
                        {task.notes && (
                          <button 
                             onClick={() => toggleTaskExpansion(task.id)}
                             className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                             title={isExpanded ? t.subjects.hideNotes : t.subjects.showNotes}
                          >
                             {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                        <button 
                          onClick={() => openEditTask(task)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                  </div>
                  
                  {/* Expanded Notes Area */}
                  {isExpanded && task.notes && (
                     <div className="px-14 pb-4 text-sm text-gray-600 dark:text-gray-300 animate-in fade-in slide-in-from-top-1">
                        <p className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 whitespace-pre-wrap">
                           {task.notes}
                        </p>
                     </div>
                  )}
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
};
