import { Plus } from "lucide-react";
import { TaskCard } from "./task-card";
import { DateNavigation } from "./date-navigation";
import { MonthlyRateTracker } from "./monthly-rate-tracker";
import { useContext, useMemo } from "react";
import { TasksContext } from "../App";

/**
 * IMPORTANT RULES:
 * - recurrence_start_date / recurrence_end_date are DATE strings: "YYYY-MM-DD" (no timezone)
 * - selectedDate is also "YYYY-MM-DD"
 * - For due_at (TIMESTAMPTZ), convert to a DATE in user's tz only when needed.
 */

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toDateOnlyISO(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ✅ Parse 'YYYY-MM-DD' as LOCAL midnight safely (no string parsing ambiguity)
function parseISODate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}

// ✅ Stable "day number" for a local calendar date (avoids DST issues)
function dayNumberLocal(dateStr) {
  const d = parseISODate(dateStr);
  // Convert the *local* Y/M/D into a UTC day number
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
}

function normalizeISODate(value) {
  if (!value) return null;

  // already DATE-only string
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;

  // returns LOCAL date-only string
  return toDateOnlyISO(d);
}

// ✅ due_at (timestamptz) -> DATE-only string in USER timezone (local-friendly)
function isoFromTimestamptz(ts, tz = userTz) {
  if (!ts) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts)); // YYYY-MM-DD in user's TZ
}

// Map JS day (0 Sun..6 Sat) to DB weekday (1 Mon..7 Sun)
function jsDayToDbWeekday(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

function isOnOrAfter(dateStr, startDateStr) {
  if (!startDateStr) return true;
  return dateStr >= startDateStr;
}

function isOnOrBefore(dateStr, endDateStr) {
  if (!endDateStr) return true;
  return dateStr <= endDateStr;
}

// ✅ day diff based on local calendar days (DST-safe)
function daysBetweenISO(a, b) {
  return Math.floor(dayNumberLocal(b) - dayNumberLocal(a));
}

function startOfWeekISO(dateStr) {
  const d = parseISODate(dateStr);
  const jsDay = d.getDay(); // 0..6 Sun..Sat
  const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
  d.setDate(d.getDate() - mondayOffset);
  return toDateOnlyISO(d);
}

function monthsBetweenISO(a, b) {
  const da = parseISODate(a);
  const db = parseISODate(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

function intervalOr1(task) {
  const n = Number(task.recurrence_interval);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
 * ✅ FIXED anchor logic:
 * For recurring tasks, anchor must be a DATE string ("YYYY-MM-DD").
 * Priority:
 * 1) recurrence_anchor_date
 * 2) recurrence_start_date
 * 3) fallback to selected date's own start (so daily won't disappear)
 * 4) (optional) due_at as date in user tz (only if you want)
 */

function normalizeAnchorToDateOnly(value, tz = userTz) {
  if (!value) return null;

  // already DATE-only
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // if it looks like a timestamp (ISO with time / Z), treat as timestamptz and convert to local DATE
  if (typeof value === "string" && /T/.test(value)) {
    return isoFromTimestamptz(value, tz);
  }

  // fallback: try normal normalize (Date -> local YYYY-MM-DD)
  return normalizeISODate(value);
}


function getAnchorDateISO(task, dateStr) {
  const raw =
    task.recurrence_anchor_date ||
    task.recurrence_start_date ||
    dateStr ||
    task.due_at ||
    null;

  // ✅ force anchor to ALWAYS be "YYYY-MM-DD" in user's timezone
  return normalizeAnchorToDateOnly(raw);
}


export function TaskList() {
  const { tasks, selectedSection, selectedDate, onSelectDate, onAddTask } = useContext(TasksContext);

  // Make "today" consistent with selectedDate format
  const todayStr = useMemo(() => toDateOnlyISO(new Date()), []);

  // console.log("selected Date : ", selectedDate, typeof selectedDate);

  // ✅ selectedDate is already "YYYY-MM-DD" => keep it local & comparable
  const selectedDateISO = normalizeISODate(selectedDate) || todayStr;

  const isTaskDueOnDate = (task, dateStr) => {
    // One-time tasks: compare due_at's LOCAL DATE in user's tz
    if (task.type === "one_time") {
      if (!task.due_at) return false;
      return isoFromTimestamptz(task.due_at) === dateStr;
    }

    // Recurring tasks
    if (task.type === "recurring") {
      const startDate = task.recurrence_start_date || null;
      const endDate = task.recurrence_end_date || null;

      if (!isOnOrAfter(dateStr, startDate)) return false;
      if (!isOnOrBefore(dateStr, endDate)) return false;

      const interval = intervalOr1(task);
      const anchor = getAnchorDateISO(task, startDate || dateStr);
      if (!anchor) return false;

      const date = parseISODate(dateStr);
      const dbWeekday = jsDayToDbWeekday(date.getDay());
      const dayOfMonth = date.getDate();

      // DAILY
      if (task.recurrence_frequency === "daily") {
        const diffDays = daysBetweenISO(anchor, dateStr);
        // console.log("anchor : ", anchor, dateStr);
        // console.log(task.title, diffDays);
        return diffDays >= 0 && diffDays % interval === 0;
      }

      // WEEKLY
      if (task.recurrence_frequency === "weekly") {
        const days = Array.isArray(task.recurrence_by_weekday) ? task.recurrence_by_weekday : [];

        const effectiveDays = days.length ? days : [jsDayToDbWeekday(parseISODate(anchor).getDay())];
        if (!effectiveDays.includes(dbWeekday)) return false;

        const anchorWeekStart = startOfWeekISO(anchor);
        const thisWeekStart = startOfWeekISO(dateStr);
        const diffWeeks = Math.floor(daysBetweenISO(anchorWeekStart, thisWeekStart) / 7);

        return diffWeeks >= 0 && diffWeeks % interval === 0;
      }

      // MONTHLY
      if (task.recurrence_frequency === "monthly") {
        const days = Array.isArray(task.recurrence_by_monthday) ? task.recurrence_by_monthday : [];

        const effectiveDays = days.length ? days : [parseISODate(anchor).getDate()];
        if (!effectiveDays.includes(dayOfMonth)) return false;

        const diffMonths = monthsBetweenISO(anchor, dateStr);
        return diffMonths >= 0 && diffMonths % interval === 0;
      }

      return false;
    }

    return false;
  };

  const isWeeklyTask = (task) => task.type === "recurring" && task.recurrence_frequency === "weekly";
  const isMonthlyTask = (task) => task.type === "recurring" && task.recurrence_frequency === "monthly";
  const isInCategory = (task, categoryId) => task.category_id === categoryId;

  const filteredTasks = tasks.filter((task) => {
    // console.log("selectedDateISO : ", selectedDateISO);
    switch (selectedSection) {
      case "today":
        return isTaskDueOnDate(task, selectedDateISO);

      case "weekly":
        return isWeeklyTask(task);

      case "monthly":
        return isMonthlyTask(task);

      case "undone":
        return isTaskDueOnDate(task, todayStr);

      default:
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
            {selectedSection === "today" && (
              <DateNavigation selectedDate={selectedDateISO} onSelectDate={onSelectDate} />
            )}

            <div className="space-y-4 ">
              <div className="flex justify-end">
                <button
                  onClick={onAddTask}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2 hover:opacity-90 transition-opacity"
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
                filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
