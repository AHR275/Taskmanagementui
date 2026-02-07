import { Edit2, Trash2, Clock, Calendar, Bell, CheckCircle2, Circle } from "lucide-react";
import { useContext } from "react";
import { TasksContext } from "../App";

const difficultyColors = {
  easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

const importanceColors = {
  low: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  medium: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  high: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
};

function toISODateOnly(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLocalDateFromTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString();
}

function weekdayLabelFromDbValue(dbDay) {
  // dbDay: 1..7 (Mon..Sun)
  const map = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };
  return map[dbDay] ?? String(dbDay);
}

export function TaskCard({task}) {
  const {
    categories,    
    onEditTask,
    onDeleteTask,
    onToggleComplete }
    =useContext(TasksContext);
  // console.log("my task : ",task);
  const category = categories.find((c) => c.id === task.category_id);

  const getScheduleText = () => {
    // One-time
    if (task.type === "one_time") {
      if (task.due_at) return `Due: ${formatLocalDateFromTimestamp(task.due_at)}`;
      return "One-time task";
    }

    // Recurring
    if (task.type === "recurring") {
      if (task.recurrence_frequency === "daily") return "Repeats daily";

      if (task.recurrence_frequency === "weekly") {
        const days = Array.isArray(task.recurrence_by_weekday) ? task.recurrence_by_weekday : [];
        if (days.length) {
          const labels = days.slice().sort((a, b) => a - b).map(weekdayLabelFromDbValue).join(", ");
          return `Weekly: ${labels}`;
        }
        return "Weekly";
      }

      if (task.recurrence_frequency === "monthly") {
        const days = Array.isArray(task.recurrence_by_monthday) ? task.recurrence_by_monthday : [];
        if (days.length) return `Monthly: Day ${days.slice().sort((a, b) => a - b).join(", ")}`;
        return "Monthly";
      }

      // fallback
      return "Recurring task";
    }

    return "Task";
  };

  const getTimeText = () => {
    // For one_time tasks, you might store time in due_at; for recurring, time_of_day is used.
    if (task.type === "recurring") return task.time_of_day || null;

    if (task.type === "one_time") {
      if (!task.due_at) return null;
      const d = new Date(task.due_at);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      // If due_at was saved without time, this will show 00:00; you can hide that if you want.
      return `${hh}:${mm}`;
    }

    return null;
  };

  const getReminderText = () => {
    if (!task.reminder_enabled) return null;
    if (task.reminder_before_minutes == null) return null;
    return `${task.reminder_before_minutes} min before`;
  };

  const today = toISODateOnly(new Date());

  const isCompletedToday =
    task.type === "one_time"
      ? !!task.completed
      : Array.isArray(task.completedDates)
      ? task.completedDates.includes(today)
      : false;

  // Helper to convert hex color to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    if (!hex || typeof hex !== "string" || !hex.startsWith("#") || hex.length !== 7) return undefined;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get background color based on category
  const backgroundColor = category ? hexToRgba(category.color, 0.2) : undefined;
  const borderColor = category ? hexToRgba(category.color, 0.5) : undefined;

  const timeText = getTimeText();
  const reminderText = getReminderText();

  return (
    <div
      className={`border rounded-lg p-5 shadow-sm hover:shadow-md transition-all ${
        isCompletedToday ? "opacity-60" : ""
      }`}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: "3px",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Completion checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className="mt-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
          aria-label={isCompletedToday ? "Mark as incomplete" : "Mark as complete"}
        >
          {isCompletedToday ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className={`text-lg font-medium ${isCompletedToday ? "line-through" : ""}`}>
              {task.title}
            </h3>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {console.log(" task id : ", task ," : ", task.id);onEditTask(task)}}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                aria-label="Edit task"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDeleteTask(task)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {task.description && <p className="text-muted-foreground mb-4">{task.description}</p>}

          {/* Task metadata */}
          <div className="space-y-2 mb-4">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{getScheduleText()}</span>
              </div>

              {timeText && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{timeText}</span>
                </div>
              )}

              {reminderText && (
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  <span>{reminderText}</span>
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
                  borderWidth: "1px",
                  borderColor: "#ababab",
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            )}

            <span
              className={`px-3 py-1 rounded-full text-sm ${difficultyColors[task.difficulty]}`}
              style={{ borderWidth: "1px", borderColor: "#ababab" }}
            >
              {task.difficulty?.charAt(0).toUpperCase() + task.difficulty?.slice(1)}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-sm ${importanceColors[task.importance]}`}
              style={{ borderWidth: "1px", borderColor: "#ababab" }}
            >
              {task.importance?.charAt(0).toUpperCase() + task.importance?.slice(1)} Priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
