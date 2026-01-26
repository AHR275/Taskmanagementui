// import { Task } from '../App';

export function MonthlyRateTracker({ tasks }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Helper function to check if a task is due on a specific date
  const isTaskDueOnDate = (task, dateStr) => {
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
  const getDayStatus = (day) => {
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
      return { color: '#3b82f6', label: 'No tasks', percentage: null };
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
      return { color: '#fbbf24', label: 'All done', percentage: 100 };
    } else if (completionRate > 0) {
      return { color: '#10b981', label: 'Partial', percentage: Math.round(completionRate) };
    } else {
      return { color: '#ef4444', label: 'None done', percentage: 0 };
    }
  };

  // Create calendar grid
  const calendarDays = [];

  // Add empty cells before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="aspect-square" />
    );
  }

  // Add days of the month
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
        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
          Day {day}: {status.label}
        </div>
      </div>
    );
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' }
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">{monthName}</h2>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <Legend color="#3b82f6" label="No tasks" />
          <Legend color="#10b981" label="Partial completion" />
          <Legend color="#fbbf24" label="All completed" />
          <Legend color="#ef4444" label="None completed" />
          <Legend color="#9ca3af" label="Future" />
        </div>

        {/* Calendar Grid */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
