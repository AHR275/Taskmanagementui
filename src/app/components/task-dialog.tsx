import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, Category } from '@/app/App';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id'>) => void;
  initialTask?: Task;
  categories: Category[];
}

export function TaskDialog({ isOpen, onClose, onSubmit, initialTask, categories }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [scheduleType, setScheduleType] = useState<'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom'>('one-time');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  
  // Recurrence settings
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'interval'>('daily');
  const [intervalDays, setIntervalDays] = useState(2);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>([]);
  
  // Reminder settings
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState(60);
  const [recurringReminderInterval, setRecurringReminderInterval] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setDifficulty(initialTask.difficulty);
      setImportance(initialTask.importance);
      setCategory(initialTask.category);
      setScheduleType(initialTask.scheduleType);
      setDueDate(initialTask.dueDate || '');
      setDueTime(initialTask.dueTime || '');
      
      if (initialTask.recurrence) {
        setRecurrencePattern(initialTask.recurrence.pattern);
        setIntervalDays(initialTask.recurrence.interval || 2);
        setSelectedDaysOfWeek(initialTask.recurrence.daysOfWeek || []);
        setSelectedDaysOfMonth(initialTask.recurrence.daysOfMonth || []);
      }
      
      if (initialTask.reminder) {
        setReminderEnabled(initialTask.reminder.enabled);
        setReminderBeforeMinutes(initialTask.reminder.beforeMinutes);
        setRecurringReminderInterval(initialTask.reminder.recurringInterval);
      }
    } else {
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setImportance('medium');
      setCategory(categories[0]?.id || '');
      setScheduleType('one-time');
      setDueDate('');
      setDueTime('');
      setRecurrencePattern('daily');
      setIntervalDays(2);
      setSelectedDaysOfWeek([]);
      setSelectedDaysOfMonth([]);
      setReminderEnabled(false);
      setReminderBeforeMinutes(60);
      setRecurringReminderInterval(undefined);
    }
  }, [initialTask, isOpen, categories]);

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const toggleDayOfMonth = (day: number) => {
    setSelectedDaysOfMonth(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;

    let recurrence = undefined;
    if (scheduleType !== 'one-time') {
      if (scheduleType === 'daily') {
        recurrence = { pattern: 'daily' as const };
      } else if (scheduleType === 'weekly') {
        recurrence = { pattern: 'weekly' as const, daysOfWeek: selectedDaysOfWeek };
      } else if (scheduleType === 'monthly') {
        recurrence = { pattern: 'monthly' as const, daysOfMonth: selectedDaysOfMonth };
      } else if (scheduleType === 'custom') {
        recurrence = { pattern: recurrencePattern, interval: recurrencePattern === 'interval' ? intervalDays : undefined };
      }
    }

    const reminder = reminderEnabled ? {
      enabled: true,
      beforeMinutes: reminderBeforeMinutes,
      recurringInterval: recurringReminderInterval,
    } : undefined;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      importance,
      category,
      scheduleType,
      dueDate: scheduleType === 'one-time' ? dueDate : undefined,
      dueTime: dueTime || undefined,
      recurrence,
      reminder,
      completed: false,
      completedDates: [],
    });
  };

  if (!isOpen) return null;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 z-10">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-2">
          <h2 className="text-xl font-semibold">
            {initialTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div>
            <label htmlFor="title" className="block mb-2">
              Task Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="difficulty" className="block mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="importance" className="block mb-2">
                Importance
              </label>
              <select
                id="importance"
                value={importance}
                onChange={(e) => setImportance(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Type */}
          <div>
            <label htmlFor="scheduleType" className="block mb-2">
              Schedule Type
            </label>
            <select
              id="scheduleType"
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as any)}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="one-time">One-time Task</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Pattern</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            {scheduleType === 'one-time' && (
              <div>
                <label htmlFor="dueDate" className="block mb-2">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div>
              <label htmlFor="dueTime" className="block mb-2">
                Time
              </label>
              <input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Recurrence Pattern */}
          {scheduleType === 'weekly' && (
            <div>
              <label className="block mb-2">Days of Week</label>
              <div className="flex gap-2">
                {daysOfWeek.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDayOfWeek(index)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      selectedDaysOfWeek.includes(index)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'monthly' && (
            <div>
              <label className="block mb-2">Days of Month</label>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDayOfMonth(day)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      selectedDaysOfMonth.includes(day)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'custom' && (
            <div>
              <label htmlFor="recurrencePattern" className="block mb-2">
                Recurrence Pattern
              </label>
              <select
                id="recurrencePattern"
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value as any)}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              >
                <option value="daily">Every Day</option>
                <option value="interval">Every N Days</option>
              </select>
              
              {recurrencePattern === 'interval' && (
                <div>
                  <label htmlFor="intervalDays" className="block mb-2">
                    Repeat every X days
                  </label>
                  <input
                    id="intervalDays"
                    type="number"
                    min="1"
                    max="365"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(parseInt(e.target.value) || 2)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}

          {/* Reminder Settings */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                id="reminderEnabled"
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="reminderEnabled">Enable Reminder</label>
            </div>

            {reminderEnabled && (
              <div className="space-y-3 pl-6">
                <div>
                  <label htmlFor="reminderBefore" className="block mb-2 text-sm">
                    Remind me before (minutes)
                  </label>
                  <input
                    id="reminderBefore"
                    type="number"
                    min="1"
                    value={reminderBeforeMinutes}
                    onChange={(e) => setReminderBeforeMinutes(parseInt(e.target.value) || 60)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="recurringReminder" className="block mb-2 text-sm">
                    Recurring reminder every (minutes, optional)
                  </label>
                  <input
                    id="recurringReminder"
                    type="number"
                    min="1"
                    value={recurringReminderInterval || ''}
                    onChange={(e) => setRecurringReminderInterval(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Leave empty for no recurring reminder"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              {initialTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
