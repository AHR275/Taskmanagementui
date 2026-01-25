import type { Task } from '@/app/App';

interface MonthlyRateTrackerProps {
  tasks: Task[];
}

export function MonthlyRateTracker({ tasks }: MonthlyRateTrackerProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Helper function to check if a task is due on a specific date
  const isTaskDueOnDate = (task: Task, dateStr: string): boolean => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    if (task.scheduleType === 'one-time') {
      return task.dueDate === dateStr;
    }

    if (task.scheduleType === 'daily') {
      return true;
    }

    if (task.scheduleType === 'weekly' && task.recurrence?.daysOfWeek) {
      return task.recurrence.daysOfWeek.includes(dayOfWeek);
    }

    if (task.scheduleType === 'monthly' && task.recurrence?.daysOfMonth) {
      return task.recurrence.daysOfMonth.includes(dayOfMonth);
    }

    if (task.scheduleType === 'custom' && task.recurrence?.pattern === 'interval') {
      return true;
    }

    return false;
  };

  // Calculate completion rate for a specific day
  const getDayStatus = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(dateStr + 'T00:00:00');
    const todayStr = new Date().toISOString().split('T')[0];

    // Future day
    if (dateStr > todayStr) {
      return { color: '#9ca3af', label: 'Future', percentage: null };
    }

    // Get tasks due on this day
    const tasksForDay = tasks.filter(task => isTaskDueOnDate(task, dateStr));

    if (tasksForDay.length === 0) {
      return { color: '#3b82f6', label: 'No tasks', percentage: null }; // Blue
    }

    // Count completed tasks
    const completedTasks = tasksForDay.filter(task => {
      if (task.scheduleType === 'one-time') {
        return task.completed;
      }
      return task.completedDates.includes(dateStr);
    });

    const completionRate = (completedTasks.length / tasksForDay.length) * 100;

    if (completionRate === 100) {
      return { color: '#fbbf24', label: 'All done', percentage: 100 }; // Gold
    } else if (completionRate > 0) {
      return { color: '#10b981', label: 'Partial', percentage: Math.round(completionRate) }; // Green
    } else {
      return { color: '#ef4444', label: 'None done', percentage: 0 }; // Red
    }
  };

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const status = getDayStatus(day);
    calendarDays.push(
      <div
        key={day}
        className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium relative group transition-transform hover:scale-110 cursor-pointer"
        style={{ backgroundColor: status.color }}
        title={status.label}
      >
        <span className="text-white drop-shadow">
          {status.percentage !== null ? `${status.percentage}%` : ''}
        </span>
        {/* Tooltip on hover */}
        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
          Day {day}: {status.label}
        </div>
      </div>
    );
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{monthName}</h2>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#3b82f6' }} />
            <span>No tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#10b981' }} />
            <span>Partial completion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#fbbf24' }} />
            <span>All completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span>None completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#9ca3af' }} />
            <span>Future</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays}
          </div>
        </div>
      </div>
    </div>
  );
}
