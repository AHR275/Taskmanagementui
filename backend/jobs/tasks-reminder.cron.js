import pool from "../shared/databases/db.js";
// import { sendEmail } from "../shared/gmail.js";

/**
 * Reminders job:
 * - For each user, compute today in their timezone (YYYY-MM-DD)
 * - Fetch tasks due today (one_time / daily / weekly / monthly)
 * - Only tasks with reminder_enabled = true
 * - Only tasks NOT completed today (task_completions.completed_on = today)
 * - Only tasks whose computed remind_time is in [now, now + 10 minutes)
 *
 * Computed remind_time:
 *   remind_time = time_of_day - reminder_before_minutes
 *
 * Returns:
 *   task_name, task_description, category_name (+ some debug fields)
 *
 * IMPORTANT ASSUMPTION:
 *   tasks.time_of_day is a timestamptz/timestamp (full datetime), not a "time" column.
 *   If time_of_day is only TIME, tell me and I’ll rewrite the SQL to build a timestamp for today.
 */

const WINDOW_MINUTES = 30;

// ---------- Date helpers ----------

function getLocalDateISO(timeZone, date = new Date()) {
  const d = date ? new Date(date) : new Date();
  if (typeof timeZone !== "string" || timeZone.length === 0) {
    throw new Error(`Invalid timeZone: ${timeZone}`);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

function isoWeekdayFromISODate(isoDateStr) {
  // Using midday UTC to avoid DST edge issues
  const weekDay = new Date(isoDateStr + "T12:00:00Z").getUTCDay(); // 0..6
  return weekDay === 0 ? 7 : weekDay; // 1..7 (Mon..Sun)
}

// ---------- Shared SQL snippets ----------

// Computed reminder timestamp (remind_time)
const REMIND_TIME_SQL = `
(
  t.time_of_day
  - (COALESCE(t.reminder_before_minutes, 0) || ' minutes')::interval
)
`;

// Reminder window: now -> now+10min (inclusive/exclusive)
const REMIND_WINDOW_SQL = `
  ${REMIND_TIME_SQL} >= NOW()
  AND ${REMIND_TIME_SQL} < NOW() + INTERVAL '${WINDOW_MINUTES} minutes'
`;

// Must be enabled + not completed today
const REMINDER_GUARDS_SQL = `
  t.reminder_enabled = TRUE
  AND tc.id IS NULL
`;

// Base select (returns required fields)
const BASE_SELECT_SQL = `
  SELECT
    t.id,
    t.user_id,
    t.title       AS task_name,
    t.description AS task_description,
    c.name        AS category_name,
    t.time_of_day,
    t.reminder_before_minutes,
    ${REMIND_TIME_SQL} AS remind_time
  FROM tasks t
  LEFT JOIN categories c
    ON c.id = t.category_id
  LEFT JOIN task_completions tc
    ON tc.task_id = t.id
   AND tc.completed_on::date = $2::date
`;

// ---------- 1) One-time due today ----------

export async function dueOneTimeToday(userId, todayLocal) {
  const sql = `
    ${BASE_SELECT_SQL}
    WHERE t.user_id = $1
      AND t.type = 'one_time'
      AND t.time_of_day::date = $2::date
      AND ${REMINDER_GUARDS_SQL}
      AND ${REMIND_WINDOW_SQL}
    ORDER BY remind_time ASC;
  `;

  const res = await pool.query(sql, [userId, todayLocal]);
  return res.rows;
}

// ---------- 2) Daily recurring due today ----------

export async function dueDailyToday(userId, todayLocal) {
  const sql = `
    ${BASE_SELECT_SQL}
    WHERE t.user_id = $1
      AND t.type = 'recurring'
      AND t.recurrence_frequency = 'daily'
      AND t.recurrence_start_date <= $2::date
      AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)
      AND (
        (($2::date - COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int
          % COALESCE(t.recurrence_interval, 1)
        ) = 0
      )
      -- due "today" in terms of schedule, and time_of_day must also be today
      AND t.time_of_day::date = $2::date
      AND ${REMINDER_GUARDS_SQL}
      AND ${REMIND_WINDOW_SQL}
    ORDER BY remind_time ASC;
  `;

  const res = await pool.query(sql, [userId, todayLocal]);
  return res.rows;
}

// ---------- 3) Weekly recurring due today ----------

export async function dueWeeklyToday(userId, todayLocal) {
  const iso = isoWeekdayFromISODate(todayLocal);

  const sql = `
    ${BASE_SELECT_SQL}
    WHERE t.user_id = $1
      AND t.type = 'recurring'
      AND t.recurrence_frequency = 'weekly'
      AND t.recurrence_start_date <= $2::date
      AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)
      AND (
        ( (($2::date - COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int / 7)
          % COALESCE(t.recurrence_interval, 1)
        ) = 0
      )
      AND $3 = ANY(t.recurrence_by_weekday)
      AND t.time_of_day::date = $2::date
      AND ${REMINDER_GUARDS_SQL}
      AND ${REMIND_WINDOW_SQL}
    ORDER BY remind_time ASC;
  `;

  const res = await pool.query(sql, [userId, todayLocal, iso]);
  return res.rows;
}

// ---------- 4) Monthly recurring due today ----------

export async function dueMonthlyToday(userId, todayLocal) {
  const sql = `
    ${BASE_SELECT_SQL}
    WHERE t.user_id = $1
      AND t.type = 'recurring'
      AND t.recurrence_frequency = 'monthly'
      AND t.recurrence_start_date <= $2::date
      AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)
      AND (
        (
          (
            (EXTRACT(YEAR  FROM $2::date)::int - EXTRACT(YEAR  FROM COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int) * 12
            + (EXTRACT(MONTH FROM $2::date)::int - EXTRACT(MONTH FROM COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int)
          )
          % COALESCE(t.recurrence_interval, 1)
        ) = 0
      )
      AND (
        EXTRACT(DAY FROM $2::date)::int
        =
        LEAST(
          EXTRACT(DAY FROM COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int,
          EXTRACT(DAY FROM (date_trunc('month', $2::date) + INTERVAL '1 month - 1 day'))::int
        )
      )
      AND t.time_of_day::date = $2::date
      AND ${REMINDER_GUARDS_SQL}
      AND ${REMIND_WINDOW_SQL}
    ORDER BY remind_time ASC;
  `;

  const res = await pool.query(sql, [userId, todayLocal]);
  return res.rows;
}

// ---------- Entrypoint (cron) ----------

export default async function tasksReminder() {
  const usersRes = await pool.query(
    "SELECT id, username,email, timezone FROM users"
  );

  for (const user of usersRes.rows) {
    console.log(user.username)
    const todayLocal = getLocalDateISO(user.timezone);

    const [oneTime, daily, weekly, monthly] = await Promise.all([
      dueOneTimeToday(user.id, todayLocal),
      dueDailyToday(user.id, todayLocal),
      dueWeeklyToday(user.id, todayLocal),
      dueMonthlyToday(user.id, todayLocal),
    ]);

    const due = [...oneTime, ...daily, ...weekly, ...monthly];

    console.log(due);

    if (due.length > 0) {
      console.log("REMINDERS_DUE", {
        user: user.username,
        todayLocal,
        count: due.length,
      });

      // Example payload returned:
      // [{ task_name, task_description, category_name, remind_time, time_of_day, reminder_before_minutes }, ...]
      // TODO: send notifications here
      // for (const task of due) await notifyUser(user.id, task);

      // For now just log tasks
      for (const t of due) {
        console.log("TASK", {
          task_name: t.task_name,
          task_description: t.task_description,
          category_name: t.category_name,
          remind_time: t.remind_time,
        });

        // sendEmail()


      }
    }
  }
}
