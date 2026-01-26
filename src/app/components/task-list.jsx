import { Plus } from 'lucide-react';
import { TaskCard } from '../components/task-card';
import { DateNavigation } from '../components/date-navigation';
import { MonthlyRateTracker } from '../components/monthly-rate-tracker';
// import  { Task, Category } from '../App';


export function TaskList({
  tasks,
  categories,
  selectedSection,
  selectedDate,
  onSelectDate,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
}) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentDayOfWeek = today.getDay();
  const currentDayOfMonth = today.getDate();

  // Helper function to check if a task is due on a specific date
  const isTaskDueOnDate = (task, dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    // One-time tasks
    if (task.scheduleType === 'one-time') {
      return task.dueDate === dateStr;
    }

    // Daily tasks
    if (task.scheduleType === 'daily') {
      return true;
    }

    // Weekly tasks
    if (task.scheduleType === 'weekly' && task.recurrence?.daysOfWeek) {
      return task.recurrence.daysOfWeek.includes(dayOfWeek);
    }

    // Monthly tasks
    if (task.scheduleType === 'monthly' && task.recurrence?.daysOfMonth) {
      return task.recurrence.daysOfMonth.includes(dayOfMonth);
    }

    // Custom interval tasks
    if (task.scheduleType === 'custom' && task.recurrence?.pattern === 'interval') {
      // This would need more complex logic with a start date
      // For now, simplified implementation
      return true;
    }

    return false;
  };

  // Helper function to check if a task is due today
  const isTaskDueToday = (task) => {
    return isTaskDueOnDate(task, todayStr);
  };

  // Helper function to check if a task is weekly
  const isWeeklyTask = (task) => {
    return task.scheduleType === 'weekly' ;
  };

  // Helper function to check if a task is monthly
  const isMonthlyTask = (task) => {
    return task.scheduleType === 'monthly'  ;
  };

  // Filter tasks based on selected section
  const filteredTasks = tasks.filter((task) => {
    switch (selectedSection) {
      case 'today':
        return isTaskDueOnDate(task, selectedDate);
      case 'weekly':
        return isWeeklyTask(task);
      case 'monthly':
        return isMonthlyTask(task);
      case 'undone':
        return !task.completed || (task.scheduleType !== 'one-time' && !task.completedDates.includes(todayStr));
      default:
        // Custom category
        return task.category === selectedSection;
    }
  });

  // Get section title
  const getSectionTitle = () => {
    switch (selectedSection) {
      case 'today':
        return 'Today Tasks';
      case 'weekly':
        return 'Weekly Tasks';
      case 'monthly':
        return 'Monthly Tasks';
      case 'undone':
        return 'Undone Tasks';
      default:
        const category = categories.find(c => c.id === selectedSection);
        return category?.name || 'Tasks';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Show Monthly Rate Tracker if in monthlyRate section */}
        {selectedSection === 'monthlyRate' ? (
          <MonthlyRateTracker tasks={tasks} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{getSectionTitle()}</h2>
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>

            {/* Date Navigation - only show for "today" section */}
            {selectedSection === 'today' && (
              <DateNavigation selectedDate={selectedDate} onSelectDate={onSelectDate} />
            )}

            {/* Task List */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
                  <p>No tasks in this section yet.</p>
                  <button
                    onClick={onAddTask}
                    className="mt-4 text-primary hover:underline"
                  >
                    Add your first task
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    categories={categories}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onToggleComplete={onToggleComplete}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}