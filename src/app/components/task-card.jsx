import { Edit2, Trash2, Clock, Calendar, Bell, CheckCircle2, Circle } from 'lucide-react';
// import  { Task, Category } from '../App';


const difficultyColors = {
  easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const importanceColors = {
  low: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  high: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

export function TaskCard({ task, categories, onEdit, onDelete, onToggleComplete }) {
  const category = categories.find(c => c.id === task.category);

  const getScheduleText = () => {
    if (task.scheduleType === 'one-time') {
      return task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'One-time task';
    }
    if (task.scheduleType === 'daily') {
      return 'Repeats daily';
    }
    if (task.scheduleType === 'weekly' && task.recurrence?.daysOfWeek) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const selectedDays = task.recurrence.daysOfWeek.map(d => days[d]).join(', ');
      return `Weekly: ${selectedDays}`;
    }
    if (task.scheduleType === 'monthly' && task.recurrence?.daysOfMonth) {
      const days = task.recurrence.daysOfMonth.join(', ');
      return `Monthly: Day ${days}`;
    }
    if (task.scheduleType === 'custom' && task.recurrence?.pattern === 'interval') {
      return `Every ${task.recurrence.interval} days`;
    }
    return 'Recurring task';
  };

  const getReminderText = () => {
    if (!task.reminder?.enabled) return null;
    
    const parts = [];
    parts.push(`${task.reminder.beforeMinutes} min before`);
    if (task.reminder.recurringInterval) {
      parts.push(`every ${task.reminder.recurringInterval} min`);
    }
    return parts.join(', ');
  };

  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = task.scheduleType === 'one-time' 
    ? task.completed 
    : task.completedDates.includes(today);

  // Helper to convert hex color to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get background color based on category
  const backgroundColor = category ? hexToRgba(category.color, 0.2) : undefined;
  const borderColor = category ? hexToRgba(category.color, 0.5) : undefined;

  return (
    <div 
      className={`border rounded-lg p-5 shadow-sm hover:shadow-md transition-all ${
        isCompletedToday ? 'opacity-60' : ''
      }`}
      style={{ 
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth:"3px"
      }}
    >
      <div className="flex items-start gap-4">
        {/* Completion checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className="mt-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
          aria-label={isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompletedToday ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className={`text-lg font-medium ${isCompletedToday ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                aria-label="Edit task"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-muted-foreground mb-4">{task.description}</p>
          )}
          
          {/* Task metadata */}
          <div className="space-y-2 mb-4">
            {/* Schedule and time */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{getScheduleText()}</span>
              </div>
              {task.dueTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{task.dueTime}</span>
                </div>
              )}
              {getReminderText() && (
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  <span>{getReminderText()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {category && (
              <span 
                className="px-3 py-1 rounded-full text-sm flex items-center gap-1.5"
                style={{ 
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                  borderWidth: '1px',
                  borderColor:"#ababab"
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm ${difficultyColors[task.difficulty]}`}
              style={{
                  borderWidth: '1px',
                  borderColor:"#ababab"
              }}
            >
              {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${importanceColors[task.importance]}`}
              style={{
                  borderWidth: '1px',
                  borderColor:"#ababab"
              }}
              
              >
              {task.importance.charAt(0).toUpperCase() + task.importance.slice(1)} Priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}