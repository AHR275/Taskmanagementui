import { useState, useEffect } from "react";
import { X } from "lucide-react";

function toISODate(d) {
  // returns YYYY-MM-DD (local)
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function combineDateTimeToISO(dueDate, dueTime) {
  // If you need timezone-safe server timestamps, prefer sending date+time separately and combine server-side.
  // For now: "YYYY-MM-DDTHH:mm:00"
  if (!dueDate) return undefined;
  const t = dueTime ? `${dueTime}:00` : "00:00:00";
  return `${dueDate}T${t}`;
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
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  // Recurrence
  const [interval, setInterval] = useState(1); // every N units (days/weeks/months)
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([]); // 1..7 (Mon..Sun)
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState([]); // 1..31

  // Reminder (fits task_reminders table: before_minutes; recurring interval isn't in schema—keep client-only if you want)
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState(60);

  const isRecurring = scheduleType !== "one-time";
  const recurrenceFrequency = isRecurring ? scheduleType : null; // daily|weekly|monthly

  useEffect(() => {
    if (initialTask) {
      // Support BOTH your old shape and DB-ready shape
      setTitle(initialTask.title ?? "");
      setDescription(initialTask.description ?? "");
      setDifficulty(initialTask.difficulty ?? "medium");
      setImportance(initialTask.importance ?? "medium");

      // category: old = "health" name/id; new = category_id
      setCategoryId(initialTask.category_id ?? initialTask.category ?? categories?.[0]?.id ?? "");

      // Determine scheduleType
      // DB shape: type + recurrence_frequency
      if (initialTask.type === "one_time" || initialTask.scheduleType === "one-time") {
        setScheduleType("one-time");
      } else if (initialTask.recurrence_frequency) {
        setScheduleType(initialTask.recurrence_frequency); // daily/weekly/monthly
      } else if (initialTask.scheduleType) {
        // old scheduleType: daily/weekly/monthly/custom
        setScheduleType(initialTask.scheduleType === "custom" ? "daily" : initialTask.scheduleType);
      } else {
        setScheduleType("one-time");
      }

      // Time fields
      // DB: due_at (timestamp) + time_of_day (time)
      // Old: dueDate + dueTime
      if (initialTask.due_at) {
        // due_at expected ISO string
        const d = new Date(initialTask.due_at);
        setDueDate(toISODate(d));
        setDueTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      } else {
        setDueDate(initialTask.dueDate ?? "");
        setDueTime(initialTask.dueTime ?? initialTask.time_of_day ?? "");
      }

      // Recurrence
      setInterval(initialTask.recurrence_interval ?? initialTask?.recurrence?.interval ?? 1);

      // weekly days: DB uses 1..7 (Mon..Sun)
      // old used 0..6 (Sun..Sat). Convert if needed.
      const byWeekday =
        initialTask.recurrence_by_weekday ??
        (initialTask?.recurrence?.daysOfWeek
          ? initialTask.recurrence.daysOfWeek.map((d) => {
              // old: 0..6 (Sun..Sat) => new: 1..7 (Mon..Sun)
              // mapping: Sun(0)->7, Mon(1)->1, Tue(2)->2,... Sat(6)->6
              return d === 0 ? 7 : d;
            })
          : []);

      setSelectedDaysOfWeek(byWeekday);

      const daysOfMonth = initialTask?.recurrence?.daysOfMonth ?? initialTask.recurrence_by_monthday ?? [];
      setSelectedDaysOfMonth(daysOfMonth);

      // Reminder
      const r = initialTask.reminder ?? null;
      if (r) {
        setReminderEnabled(!!r.enabled);
        setReminderBeforeMinutes(r.beforeMinutes ?? 60);
      } else {
        // DB might store reminders in another table, so default off
        setReminderEnabled(false);
        setReminderBeforeMinutes(60);
      }
    } else {
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
    // setIsLoading(true);
    if (!title.trim() || !categoryId) return;

    // Build payload that fits your DB table
    const payload = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      importance,
      category_id: categoryId,

      // tasks table
      type: scheduleType === "one-time" ? "one_time" : "recurring",
      due_at: scheduleType === "one-time" ? combineDateTimeToISO(dueDate, dueTime) : undefined,
      time_of_day: scheduleType !== "one-time" ? (dueTime || undefined) : undefined,

      recurrence_frequency: scheduleType !== "one-time" ? recurrenceFrequency : undefined,
      recurrence_interval: scheduleType !== "one-time" ? interval : undefined,

      // Weekly / Monthly extras (stored in tasks table)
      recurrence_by_weekday:
        scheduleType === "weekly" ? (selectedDaysOfWeek.length ? selectedDaysOfWeek : undefined) : undefined,

      // NOTE: your tasks table doesn’t have month-day array in the version we wrote.
      // If you want monthly specific days, you have two choices:
      // (A) Add a column: recurrence_by_monthday smallint[]  (recommended)
      // (B) Store it as JSON
      // For now, I’ll include it in payload so you can store it (A or B).
      recurrence_by_monthday:
        scheduleType === "monthly" ? (selectedDaysOfMonth.length ? selectedDaysOfMonth : undefined) : undefined,

      // Good defaults for scheduling
      recurrence_start_date:
        scheduleType !== "one-time" ? (dueDate || toISODate(new Date())) : undefined,

      recurrence_anchor_date:
        scheduleType !== "one-time" ? (dueDate || toISODate(new Date())) : undefined,

      // Reminder maps to task_reminders table (separate insert)
      reminder: reminderEnabled
        ? {
            enabled: true,
            before_minutes: reminderBeforeMinutes,
          }
        : { enabled: false },
    };
    console.log("initail Task  : " , initialTask);
    if(initialTask)payload.id= initialTask.id ; 

    onSubmit(payload);
    // setIsLoading(false);
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
                    onChange={(e) => setReminderBeforeMinutes(parseInt(e.target.value) || 60)}
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
