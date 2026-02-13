import pool from "../shared/databases/db.js";

// Returns YYYY-MM-DD for "now" in the user's timezone, or for a given date in that timezone
function getLocalDateISO(timeZone, date = new Date()) {
  const d = date ? new Date(date) : new Date();

  // Guard: timeZone must be a valid IANA string
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

function prevDateISO(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d)); // avoid DST issues
  dt.setUTCDate(dt.getUTCDate() - 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// --------------------- COUNTS (SQL UNCHANGED) ---------------------

async function OneTimeCounts(user, prevDate) {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS due_count,
        COUNT(*) FILTER (WHERE tc.id IS NULL)::int AS missed_count
      FROM tasks t
      LEFT JOIN task_completions tc
        ON tc.task_id = t.id
      AND tc.completed_on::date = $2::date
      WHERE t.user_id = $1
        AND t.type = 'one_time'
        AND t.due_at::date = $2::date;
      `,
      [user.id, prevDate]
    );

    const { due_count, missed_count } = result.rows[0];
    return { due: due_count, missed: missed_count };
  } catch (error) {
    console.error("OneTimeCounts:", error.message);
    return { due: 0, missed: 0 };
  }
}

async function DailyCounts(user, prevDate) {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS due_count,
        COUNT(*) FILTER (WHERE tc.id IS NULL)::int AS missed_count
      FROM tasks t
      LEFT JOIN task_completions tc
        ON tc.task_id = t.id
      AND tc.completed_on::date = $2::date
      WHERE t.user_id = $1
        AND t.type = 'recurring'
        AND t.recurrence_frequency = 'daily'
        AND t.recurrence_start_date <= $2::date
        AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)
        AND (
          (($2::date - COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int
            % COALESCE(t.recurrence_interval, 1)
          ) = 0
        );
      `,
      [user.id, prevDate]
    );

    const { due_count, missed_count } = result.rows[0];
    return { due: due_count, missed: missed_count };
  } catch (error) {
    console.error("DailyCounts:", error.message);
    return { due: 0, missed: 0 };
  }
}

async function WeeklyCounts(user, prevDate) {
  try {
    const weekDay = new Date(prevDate + "T12:00:00Z").getUTCDay(); // 0..6
    const iso = weekDay === 0 ? 7 : weekDay; // 1..7 (Mon..Sun)

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS due_count,
        COUNT(*) FILTER (WHERE tc.id IS NULL)::int AS missed_count
      FROM tasks t
      LEFT JOIN task_completions tc
        ON tc.task_id = t.id
      AND tc.completed_on::date = $2::date
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
        AND $3 = ANY(t.recurrence_by_weekday);
      `,
      [user.id, prevDate, iso]
    );

    const { due_count, missed_count } = result.rows[0];
    return { due: due_count, missed: missed_count };
  } catch (error) {
    console.error("WeeklyCounts:", error.message);
    return { due: 0, missed: 0 };
  }
}

async function MonthlyCounts(user, prevDate) {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS due_count,
        COUNT(*) FILTER (WHERE tc.id IS NULL)::int AS missed_count
      FROM tasks t
      LEFT JOIN task_completions tc
        ON tc.task_id = t.id
       AND tc.completed_on::date = $2::date
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
            EXTRACT(
              DAY FROM (date_trunc('month', $2::date) + INTERVAL '1 month - 1 day')
            )::int
          )
        );
      `,
      [user.id, prevDate]
    );

    const { due_count, missed_count } = result.rows[0];
    return { due: due_count, missed: missed_count };
  } catch (error) {
    console.error("MonthlyCounts:", error.message);
    return { due: 0, missed: 0 };
  }
}

// --------------------- BUSINESS LOGIC ---------------------

async function isAllTasksCompletedWithDue(user, prevDate) {
  const [one, daily, weekly, monthly] = await Promise.all([
    OneTimeCounts(user, prevDate),
    DailyCounts(user, prevDate),
    WeeklyCounts(user, prevDate),
    MonthlyCounts(user, prevDate),
  ]);

  const totalDue = one.due + daily.due + weekly.due + monthly.due;
  const totalMissed = one.missed + daily.missed + weekly.missed + monthly.missed;

  return { totalDue, totalMissed, ok: totalDue > 0 && totalMissed === 0 };
}

async function handleNewDayForUser(user, prevDate, todayLocal) {
  const { totalDue, totalMissed, ok } = await isAllTasksCompletedWithDue(
    user,
    prevDate
  );

  // If no tasks due, just mark processed so we don’t re-check every hour
  if (totalDue === 0) {
    await pool.query(
      `
      UPDATE users
      SET last_processed_date = $2::date
      WHERE id = $1;
      `,
      [user.id, todayLocal]
    );

    console.log("NO DUE TASKS", user.username, { todayLocal, prevDate });
    return;
  }

  if (!ok) {
    await pool.query(
      `
      UPDATE users
      SET
        streak_current = 0,
        last_processed_date = $2::date
      WHERE id = $1;
      `,
      [user.id, todayLocal]
    );

    console.log("RESET", user.username, { todayLocal, prevDate, totalDue, totalMissed });
    return;
  }

  const res = await pool.query(
    `
    UPDATE users
    SET
      streak_current = COALESCE(streak_current, 0) + 1,
      streak_best = GREATEST(COALESCE(streak_best, 0), COALESCE(streak_current, 0) + 1),
      last_processed_date = $2::date
    WHERE id = $1
    RETURNING username, streak_current, streak_best, last_processed_date;
    `,
    [user.id, todayLocal]
  );

  console.log("INCREMENT", res.rows[0]);
}

// --------------------- ENTRYPOINT ---------------------

export default async function dailyStreak() {
  const usersRes = await pool.query(
    "SELECT id, username, timezone, last_processed_date FROM users"
  );

  for (const user of usersRes.rows) {
    const tz = user.timezone;
    const todayLocal = getLocalDateISO(tz);         // YYYY-MM-DD in user tz
    const prevDate = prevDateISO(todayLocal);       // YYYY-MM-DD

    // Convert last_processed_date (Date from pg) -> YYYY-MM-DD string (in UTC)
    // We compare string-to-string (safe + simple)
    const lastProcessedLocal = user.last_processed_date
      ? getLocalDateISO(user.timezone, user.last_processed_date)
      : null;

    const shouldRun = !lastProcessedLocal || todayLocal > lastProcessedLocal;

    // console.log("USER", user.id, {
    //   username: user.username,
    //   tz,
    //   lastProcessedLocal,
    //   todayLocal,
    //   prevDate,
    //   shouldRun,
    // });

    if (!shouldRun) continue;

    await handleNewDayForUser(user, prevDate, todayLocal);
  }
}
