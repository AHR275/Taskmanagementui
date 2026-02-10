import pool from "../shared/databases/db";

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

async function  getUsersData(prevDate){
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  try {
      
    const result  = await pool.query("SELECT id , timezone , last_processed_date FROM users WHERE  last_processed_date = $1  ", prevDate);
    return result.json(result.rows);
  } catch (error) {
      console.error(error.message)
  }
}

async function OneTimeTasks(user,prevDate) {
  try {
    
    const UnCompleteTasks = await pool.query(`
      SELECT t.id
      FROM tasks t
      LEFT JOIN task_completions tc
        ON tc.task_id = t.id
      AND tc.completed_on::date = $2
      WHERE t.user_id = $1
        AND t.type = 'one_time'
        AND t.due_at::date = $2
        AND tc.id IS NULL;

      `,[user.id, prevDate])

    if(UnCompleteTasks.rowCount===0)return true;
    else return false 
  


  } catch (error) {
    console.error(error.message)
    
  }
}

async function DailyTasks(user,prevDate) {
  try {
    
    const UnCompleteTasks = await pool.query(`
      SELECT t.id
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
        )

        
        AND tc.id IS NULL;


      `,[user.id, prevDate])

    if(UnCompleteTasks.rowCount===0)return true;
    else return false 
  


  } catch (error) {
    console.error(error.message)
    
  }
}
async function WeeklyTasks(user,prevDate) {
  try {
    const weekDay = new Date(prevDate + "T12:00:00Z").getUTCDay(); // 0..6 (Sun..Sat)
    const iso = weekDay === 0 ? 7 : weekDay; // 1..7 (Mon..Sun)
    const UnCompleteTasks = await pool.query(`
      SELECT t.id
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

        AND $3 = ANY(t.recurrence_by_weekday)




        
        AND tc.id IS NULL;


      `,[user.id, prevDate,iso])

    if(UnCompleteTasks.rowCount===0)return true;
    else return false 
  


  } catch (error) {
    console.error(error.message)
    
  }
}

async function MonthlyTasks(user, prevDate) {
  try {
    const UnCompleteTasks = await pool.query(
      `
      SELECT t.id
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
        )

        -- not completed
        AND tc.id IS NULL;
      `,
      [user.id, prevDate]
    );

    return UnCompleteTasks.rowCount === 0;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}


async function IsAllTasksCompleted(user,prevDate) {

  return (
    OneTimeTasks(user,prevDate)&&
    DailyTasks(user,prevDate)&&
    WeeklyTasks(user,prevDate)&&
    MonthlyTasks(user,prevDate)
  )


  
}
async function handleNewDayForUser(user ,prevDate,todayLocal) {

  if(!IsAllTasksCompleted(user,prevDate)){
        pool.query(`
      UPDATE users
      SET
        streak_current = 0, 
        last_processed_date = $2
      WHERE id = $1;
  
      `,[user.id,todayLocal])

  }else{

    pool.query(`
      UPDATE users
      SET
        streak_current = streak_current + 1,
        streak_best = CASE
        WHEN streak_current + 1 > streak_best
        THEN streak_current + 1
        ELSE streak_best
        END, 
        last_processed_date = $2
      WHERE id = $1;
  
      `,[user.id,todayLocal])
  }

  
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
}
