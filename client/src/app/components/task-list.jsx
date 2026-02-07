import { Plus } from "lucide-react";
import { TaskCard } from "./task-card";
import { DateNavigation } from "./date-navigation";
import { MonthlyRateTracker } from "./monthly-rate-tracker";
import { useContext } from "react";
import { TasksContext } from "../App";

function toDateOnlyISO(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISODate(dateStr) {
  // dateStr: 'YYYY-MM-DD' (local midnight to avoid timezone shifting)
  return new Date(`${dateStr}T00:00:00`);
}

function isoFromTimestamptz(ts) {
  // returns YYYY-MM-DD from a timestamptz string
  const d = new Date(ts);
  return toDateOnlyISO(d);
}

// Map JS day (0 Sun..6 Sat) to DB weekday (1 Mon..7 Sun)
function jsDayToDbWeekday(jsDay) {
  return jsDay === 0 ? 7 : jsDay; // Sun->7, Mon->1, ..., Sat->6
}

function isOnOrAfter(dateStr, startDateStr) {
  if (!startDateStr) return true;
  return dateStr >= startDateStr; // ISO date strings compare safely
}

function daysBetweenISO(a, b) {
  // a, b are 'YYYY-MM-DD'
  const da = parseISODate(a);
  const db = parseISODate(b);
  const ms = db.getTime() - da.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function startOfWeekISO(dateStr) {
  // Monday-start week anchor (fits DB weekday 1..7)
  const d = parseISODate(dateStr);
  const jsDay = d.getDay(); // 0..6 (Sun..Sat)
  // convert to Monday-based offset: Mon=0..Sun=6
  const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
  d.setDate(d.getDate() - mondayOffset);
  return toDateOnlyISO(d);
}

function monthsBetweenISO(a, b) {
  const da = parseISODate(a);
  const db = parseISODate(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

function getAnchorDate(task) {
  // best anchor order:
  // 1) recurrence_anchor_date
  // 2) recurrence_start_date
  // 3) (fallback) due_at date if exists
  return (
    task.recurrence_anchor_date ||
    task.recurrence_start_date ||
    (task.due_at ? isoFromTimestamptz(task.due_at) : null)
  );
}

function intervalOr1(task) {
  const n = Number(task.recurrence_interval);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}


function normalizeISODate(value) {
  // Always return YYYY-MM-DD or null
  if (!value) return null;

  // Already correct
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Date object or other parseable string
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


export function TaskList() {
  const {
    tasks,

    selectedSection,
    selectedDate,
    onSelectDate,
    onAddTask,

  }= useContext(TasksContext)
  const todayStr = toDateOnlyISO(new Date());
  const selectedDateISO = normalizeISODate(selectedDate);

  // ✅ DB-compatible + interval-aware: check if task is due on a specific date
  const isTaskDueOnDate = (task, dateStr) => {
    // One-time tasks
    if (task.type === "one_time") {
      if (!task.due_at) return false;
      return isoFromTimestamptz(task.due_at) === dateStr;
    }

    // Recurring tasks
    if (task.type === "recurring") {
      // gate by start/end date (optional)
      if (!isOnOrAfter(dateStr, task.recurrence_start_date)) return false;
      if (task.recurrence_end_date && dateStr > task.recurrence_end_date) return false;

      const interval = intervalOr1(task);
      const anchor = getAnchorDate(task);
      if (!anchor) return false;

      const date = parseISODate(dateStr);
      const dbWeekday = jsDayToDbWeekday(date.getDay()); // 1..7
      const dayOfMonth = date.getDate(); // 1..31

      // Daily: every N days from anchor
      if (task.recurrence_frequency === "daily") {
        const diffDays = daysBetweenISO(anchor, dateStr);
        return diffDays >= 0 && diffDays % interval === 0;
      }

      // Weekly: weekday must match + every N weeks from anchor week
      if (task.recurrence_frequency === "weekly") {
        const days = Array.isArray(task.recurrence_by_weekday) ? task.recurrence_by_weekday : [];
        if (days.includes(dbWeekday)) return true;

        const anchorWeekStart = startOfWeekISO(anchor);
        const thisWeekStart = startOfWeekISO(dateStr);
        const diffWeeks = Math.floor(daysBetweenISO(anchorWeekStart, thisWeekStart) / 7);

        return diffWeeks >= 0 && diffWeeks % interval === 0;
      }

      // Monthly: day-of-month must match + every N months from anchor month
      if (task.recurrence_frequency === "monthly") {
        const days = Array.isArray(task.recurrence_by_monthday) ? task.recurrence_by_monthday : [];
        if (days.includes(dayOfMonth)) return true;

        const diffMonths = monthsBetweenISO(anchor, dateStr);
        return diffMonths >= 0 && diffMonths % interval === 0;
      }

      return false;
    }

    return false;
  };

  // "Undone" check (minimal — adjust later when you move completion to DB)
  const isUndoneForToday = (task) => {
    if (task.type === "one_time") return !task.completed;

    // If you're still using old client-side completedDates:
    if (Array.isArray(task.completedDates)) {
      return !task.completedDates.includes(todayStr);
    }

    return true;
  };

  const isWeeklyTask = (task) => task.type === "recurring" && task.recurrence_frequency === "weekly";
  const isMonthlyTask = (task) => task.type === "recurring" && task.recurrence_frequency === "monthly";
  const isInCategory = (task, categoryId) => task.category_id === categoryId;
  // const selectedDateISO = normalizeISODate(selectedDate);

  const filteredTasks = tasks.filter((task) => {
    switch (selectedSection) {
      case "today":
        return isTaskDueOnDate(task, selectedDateISO);

      case "weekly":
        return isWeeklyTask(task);

      case "monthly":
        return isMonthlyTask(task);

      case "undone":
        return isTaskDueOnDate(task, todayStr) && isUndoneForToday(task);

      default:
        // custom category id
        return isInCategory(task, selectedSection);
    }
  });

  return (
    <div className="px-6 ">
      <div className="max-w-4xl mx-auto">
        {selectedSection === "monthlyRate" ? (
          <MonthlyRateTracker tasks={tasks} />
        ) : (
          <>
            <div className="flex items-center justify-between ">{/* keep layout */}</div>

            {selectedSection === "today" && (
              <DateNavigation selectedDate={selectedDate} onSelectDate={onSelectDate} />
            )}

            <div className="space-y-4 ">
              <div className="flex justify-end">
                <button
                  onClick={onAddTask}
                  className="flex  items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2 hover:opacity-90 transition-opacity"
                  style={{ top: "20px", right: "20px" }}
                >
                  <Plus className="w-5 h-5" />
                  Add Task
                </button>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
                  <p>No tasks in this section yet.</p>
                  <button onClick={onAddTask} className="mt-4 text-primary hover:underline">
                    Add your first task
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    // categories={categories}
             
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
