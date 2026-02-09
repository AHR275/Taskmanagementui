import { useState, useEffect } from "react";
import { X } from "lucide-react";

function toISODate(d) {
  // returns YYYY-MM-DD (local)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Combine local date + local time into a "datetime-local" string
// Example: "2026-02-09T02:59"
function combineDateTimeLocal(dueDate, dueTime) {
  if (!dueDate) return "";
  const t = dueTime ? dueTime : "00:00";
  return `${dueDate}T${t}`;
}

// Convert local "YYYY-MM-DDTHH:mm" into UTC ISO string for DB (timestamptz)
function localDateTimeToUTCISO(localDateTime) {
  if (!localDateTime) return undefined;
  const d = new Date(localDateTime); // interpreted as LOCAL browser time
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString(); // UTC (Z)
}

export function TaskDialog({ isOpen, onClose, onSubmit, initialTask, categories }) {
  // Basic
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [importance, setImportance] = useState("medium");
  const [categoryId, setCategoryId] = useState("");

  // Schedule
  const [scheduleType, setScheduleType] = useState("one-time"); // one-time | daily | weekly | monthly
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD (local)
  const [dueTime, setDueTime] = useState(""); // HH:mm (local)

  // Recurrence
  const [interval, setInterval] = useState(1); // every N units (days/weeks/months)
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([]); // 1..7 (Mon..Sun)
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState([]); // 1..31

  // ✅ Recurrence range (NEW)
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(""); // YYYY-MM-DD
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");     // YYYY-MM-DD (optional)

  // Reminder
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState(60);

  const isRecurring = scheduleType !== "one-time";
  const recurrenceFrequency = isRecurring ? scheduleType : null; // daily|weekly|monthly

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title ?? "");
      setDescription(initialTask.description ?? "");
      setDifficulty(initialTask.difficulty ?? "medium");
      setImportance(initialTask.importance ?? "medium");

      setCategoryId(initialTask.category_id ?? initialTask.category ?? categories?.[0]?.id ?? "");

      // Determine schedule type
      if (initialTask.type === "one_time" || initialTask.scheduleType === "one-time") {
        setScheduleType("one-time");
      } else if (initialTask.recurrence_frequency) {
        setScheduleType(initialTask.recurrence_frequency); // daily/weekly/monthly
      } else if (initialTask.scheduleType) {
        setScheduleType(initialTask.scheduleType === "custom" ? "daily" : initialTask.scheduleType);
      } else {
        setScheduleType("one-time");
      }

      // Fill dueDate/dueTime (local) from due_at (UTC ISO) if present
      if (initialTask.due_at) {
        const d = new Date(initialTask.due_at);
        setDueDate(toISODate(d));
        setDueTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      } else {
        setDueDate(initialTask.dueDate ?? "");
        setDueTime(initialTask.dueTime ?? initialTask.time_of_day ?? "");
      }

      // Interval
      setInterval(Number(initialTask.recurrence_interval ?? initialTask?.recurrence?.interval ?? 1) || 1);

      // weekly days: DB uses 1..7 (Mon..Sun); old might use 0..6 (Sun..Sat)
      const byWeekday =
        initialTask.recurrence_by_weekday ??
        (initialTask?.recurrence?.daysOfWeek
          ? initialTask.recurrence.daysOfWeek.map((d) => (d === 0 ? 7 : d))
          : []);
      setSelectedDaysOfWeek(Array.isArray(byWeekday) ? byWeekday : []);

      const daysOfMonth = initialTask?.recurrence?.daysOfMonth ?? initialTask.recurrence_by_monthday ?? [];
      setSelectedDaysOfMonth(Array.isArray(daysOfMonth) ? daysOfMonth : []);

      // ✅ Recurrence range (NEW)
      setRecurrenceStartDate(initialTask.recurrence_start_date ?? "");
      setRecurrenceEndDate(initialTask.recurrence_end_date ?? "");

      // Reminder
      const r = initialTask.reminder ?? null;
      if (r) {
        setReminderEnabled(!!r.enabled);
        setReminderBeforeMinutes(r.before_minutes ?? r.beforeMinutes ?? 60);
      } else {
        setReminderEnabled(false);
        setReminderBeforeMinutes(60);
      }
    } else {
      // reset
      setTitle("");
      setDescription("");
      setDifficulty("medium");
      setImportance("medium");
      setCategoryId(categories?.[0]?.id || "");

      setScheduleType("one-time");
      setDueDate("");
      setDueTime("");

      setInterval(1);
      setSelectedDaysOfWeek([]);
      setSelectedDaysOfMonth([]);

      // ✅ Recurrence range reset
      setRecurrenceStartDate("");
      setRecurrenceEndDate("");

      setReminderEnabled(false);
      setReminderBeforeMinutes(60);
    }
  }, [initialTask, isOpen, categories]);

  const toggleDayOfWeek = (day) => {
    // day: 1..7 (Mon..Sun)
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const toggleDayOfMonth = (day) => {
    setSelectedDaysOfMonth((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    // Validation for recurring
    if (isRecurring && !recurrenceStartDate) return;
    if (isRecurring && recurrenceEndDate && recurrenceEndDate < recurrenceStartDate) return;

    // For one-time: build local datetime then convert to UTC ISO
    const localDateTime = scheduleType === "one-time" ? combineDateTimeLocal(dueDate, dueTime) : "";
    const dueAtUtc = scheduleType === "one-time" ? localDateTimeToUTCISO(localDateTime) : undefined;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      importance,
      category_id: categoryId,

      // tasks table
      type: scheduleType === "one-time" ? "one_time" : "recurring",

      // ✅ One-time tasks store UTC instant
      due_at: scheduleType === "one-time" ? (dueAtUtc ?? undefined) : undefined,

      // ✅ Recurring tasks use time_of_day (local clock time)
      time_of_day: scheduleType !== "one-time" ? (dueTime || undefined) : undefined,

      recurrence_frequency: scheduleType !== "one-time" ? recurrenceFrequency : undefined,
      recurrence_interval: scheduleType !== "one-time" ? interval : undefined,

      recurrence_by_weekday:
        scheduleType === "weekly" ? (selectedDaysOfWeek.length ? selectedDaysOfWeek : undefined) : undefined,

      recurrence_by_monthday:
        scheduleType === "monthly" ? (selectedDaysOfMonth.length ? selectedDaysOfMonth : undefined) : undefined,

      // ✅ NEW: recurrence date range
      recurrence_start_date: scheduleType !== "one-time" ? (recurrenceStartDate || undefined) : undefined,
      recurrence_end_date: scheduleType !== "one-time" ? (recurrenceEndDate || undefined) : undefined,

      // Anchor date (important for interval math)
      recurrence_anchor_date:
        scheduleType !== "one-time" ? (recurrenceStartDate || toISODate(new Date())) : undefined,

      reminder: reminderEnabled
        ? { enabled: true, before_minutes: reminderBeforeMinutes }
        : { enabled: false },
    };

    if (initialTask?.id) payload.id = initialTask.id;

    onSubmit(payload);
  };

  if (!isOpen) return null;

  // DB expects 1..7 (Mon..Sun)
  const daysOfWeek = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 7 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 z-10">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card pb-2">
          <h2 className="text-xl font-semibold">{initialTask ? "Edit Task" : "Add New Task"}</h2>
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
                onChange={(e) => setDifficulty(e.target.value)}
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
                onChange={(e) => setImportance(e.target.value)}
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
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
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
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="one-time">One-time Task</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            {scheduleType === "one-time" && (
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
                  required
                />
              </div>
            )}

            <div className={scheduleType === "one-time" ? "" : "col-span-2"}>
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

          {/* ✅ NEW: Recurrence Start / End Date (ONLY for recurring) */}
          {isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recurrenceStartDate" className="block mb-2">
                  Start Date
                </label>
                <input
                  id="recurrenceStartDate"
                  type="date"
                  value={recurrenceStartDate}
                  onChange={(e) => setRecurrenceStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="recurrenceEndDate" className="block mb-2">
                  End Date (optional)
                </label>
                <input
                  id="recurrenceEndDate"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min={recurrenceStartDate || undefined}
                />
              </div>
            </div>
          )}

          {/* Interval (ONLY for recurring types) */}
          {isRecurring && (
            <div>
              <label htmlFor="interval" className="block mb-2">
                Repeat every
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  id="interval"
                  type="number"
                  min="1"
                  max="365"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value || "1", 10)))}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="w-full px-4 py-2 bg-input-background border border-border rounded-lg flex items-center">
                  {scheduleType === "daily" && <span>day(s)</span>}
                  {scheduleType === "weekly" && <span>week(s)</span>}
                  {scheduleType === "monthly" && <span>month(s)</span>}
                </div>
              </div>
            </div>
          )}

          {/* Weekly: Days of Week */}
          {scheduleType === "weekly" && (
            <div>
              <label className="block mb-2">Days of Week</label>
              <div className="flex gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      selectedDaysOfWeek.includes(day.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: Days of Month */}
          {scheduleType === "monthly" && (
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
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
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
                    onChange={(e) => setReminderBeforeMinutes(parseInt(e.target.value ||"1") || 60)}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              {initialTask ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
