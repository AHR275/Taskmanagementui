// server/models/task.model.js

// 1) map DB row -> API object (what you send to frontend)
export function toTask(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    importance: row.importance,
    category: row.category,
    scheduleType: row.schedule_type,
    dueTime: row.due_time,
    recurrence: row.recurrence,      // JSONB in DB
    reminder: row.reminder,          // JSONB in DB
    completed: row.completed,
    completedDates: row.completed_dates, // date[] or JSONB
  };
}

// 2) map request body -> DB columns (for INSERT/UPDATE)
export function fromBody(body) {
  return {
    title: body.title ?? "",
    description: body.description ?? "",
    difficulty: body.difficulty ?? "easy",
    importance: body.importance ?? "low",
    category: body.category ?? null,
    schedule_type: body.scheduleType ?? "daily",
    due_time: body.dueTime ?? null,
    recurrence: body.recurrence ?? { pattern: "daily" },
    reminder: body.reminder ?? { enabled: false, beforeMinutes: 0 },
    completed: body.completed ?? false,
    completed_dates: body.completedDates ?? [],
  };
}
