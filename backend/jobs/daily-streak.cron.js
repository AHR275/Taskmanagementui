import pool from "../shared/databases/db.js";

function getLocalDateISO(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // YYYY-MM-DD
}

function prevDateISO(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d)); // use UTC to avoid DST issues
  dt.setUTCDate(dt.getUTCDate() - 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}


async function OneTimeCounts(user,prevDate) {
  try {
    
    const result = await pool.query(`
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
        

      `,[user.id, prevDate])

      const {due_count, missed_count}=result.rows[0];
      return{due: due_count, missed: missed_count};
  


  } catch (error) {
    console.error(error.message)
    return { due: 0, missed: 0 };
    
  }
}

async function DailyCounts(user,prevDate) {
  try {
    
    const result = await pool.query(`
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

        -- date window
        AND t.recurrence_start_date <= $2::date
        AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)

        -- every N days: (prevDate - anchor) % interval = 0
        AND (
          (($2::date - COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int
            % COALESCE(t.recurrence_interval, 1)
          ) = 0
        );

        
        


      `,[user.id, prevDate])

      const {due_count, missed_count}=result.rows[0];
      return{due: due_count, missed: missed_count};


  } catch (error) {
    console.error(error.message);
    return { due: 0, missed: 0 };
    
  }
}
async function WeeklyCounts(user,prevDate) {
  try {
    const weekDay = new Date(prevDate + "T12:00:00Z").getUTCDay(); // 0..6 (Sun..Sat)
    const iso = weekDay === 0 ? 7 : weekDay; // 1..7 (Mon..Sun)
    const result = await pool.query(`
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

        -- date window
        AND t.recurrence_start_date <= $2::date
        AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)

        -- every N weeks:
        -- (days difference / 7) % interval = 0
        AND (
          ( (($2::date - COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int / 7)
            % COALESCE(t.recurrence_interval, 1)
          ) = 0
        )

        AND $3 = ANY(t.recurrence_by_weekday);




        
        


      `,[user.id, prevDate,iso])

      const {due_count, missed_count}=result.rows[0];
      return{due: due_count, missed: missed_count};
  


  } catch (error) {
    console.error(error.message);
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

        -- date window
        AND t.recurrence_start_date <= $2::date
        AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= $2::date)

        -- every N months: (months_diff % interval) = 0
        AND (
          (
            (
              (EXTRACT(YEAR  FROM $2::date)::int - EXTRACT(YEAR  FROM COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int) * 12
              + (EXTRACT(MONTH FROM $2::date)::int - EXTRACT(MONTH FROM COALESCE(t.recurrence_anchor_date, t.recurrence_start_date))::int)
            )
            % COALESCE(t.recurrence_interval, 1)
          ) = 0
        )

        -- due day-of-month (anchor day, clamped to last day of prevDate month)
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

        -- not completed
        
      `,
      [user.id, prevDate]
    );

      const {due_count, missed_count}=result.rows[0];
      return{due: due_count, missed: missed_count};
  } catch (error) {
    console.error(error.message);
    return { due: 0, missed: 0 };
  }
}


async function isAllTasksCompletedWithDue(user,prevDate) {

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
async function handleNewDayForUser(user ,prevDate,todayLocal) {

  const { totalDue, totalMissed, ok } = await isAllTasksCompletedWithDue(user, prevDate);

  if (totalDue === 0) {
    // no tasks due yesterday => don't change streak
       await pool.query(`
      UPDATE users
      SET
        
        last_processed_date = $2
      WHERE id = $1;
  
      `,[user.id,todayLocal])
    return;
  }

  if (!ok) {
  // set 0 
   await pool.query(`
      UPDATE users
      SET
        streak_current = 0, 
        last_processed_date = $2
      WHERE id = $1;
  
      `,[user.id,todayLocal])
} else {

  // increasment 

       await pool.query(`
      UPDATE users
      SET
        streak_current = COALESCE(streak_current, 0) + 1, 
        streak_best = GREATEST(COALESCE(streak_best, 0), COALESCE(streak_current, 0) + 1)

   
        last_processed_date = $2::date
      WHERE id = $1;
  
      `,[user.id,todayLocal])
  
}


  console.log(user.id, { todayLocal, prevDate, totalDue, totalMissed, ok });




  
}


export default async function dailyStreak() {
  const users = await pool.query(
    "SELECT id, timezone, last_processed_date FROM users"
  );



  for (const user of users.rows) {
    const todayLocal = getLocalDateISO(user.timezone);
    const prevDate = prevDateISO(todayLocal);

    if (!user.last_processed_date || todayLocal > user.last_processed_date) {
      await handleNewDayForUser(user, prevDate, todayLocal);
    }
  }

  // pool.query("UPDATE users SET streak_current=streak_current+1  WHERE username='ahr2750' ")
}
