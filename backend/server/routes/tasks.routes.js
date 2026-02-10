import express from "express";
import pool from "../../shared/databases/db.js";
// import { fromBody, toTask } from "../models.model.js";
import { requireAuth } from "../middleware/checkAuth.js";

// const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
const TasksRoutes = express.Router();

TasksRoutes.post("/", async (req, res) => {
  try {
    const {user_id} = req.body; // from auth middleware

    const {
      title,
      description,
      difficulty,
      importance,
      category_id,

      type,
      due_at,
      time_of_day,

      recurrence_frequency,
      recurrence_interval,
      recurrence_by_weekday,
      recurrence_by_monthday,
      recurrence_start_date,
      recurrence_end_date,
      recurrence_anchor_date,

      reminder
    } = req.body;

    // const local_due_at = new Date(due_at).toLocaleString("en-US", {
    //   timeZone: timeZone,
    // });

    const result = await pool.query(
      `
      INSERT INTO tasks (
        user_id,
        category_id,
        title,
        description,
        difficulty,
        importance,
        type,
        due_at,
        time_of_day,
        recurrence_frequency,
        recurrence_interval,
        recurrence_by_weekday,
        recurrence_by_monthday,
        recurrence_start_date,
        recurrence_end_date,
        recurrence_anchor_date,
        reminder_enabled,
        reminder_before_minutes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *
      `,
      [
        user_id,
        category_id,
        title,
        description,
        difficulty,
        importance,
        type,
        due_at ?? null,
        time_of_day ?? null,
        recurrence_frequency ?? null,
        recurrence_interval ?? 0,
        recurrence_by_weekday ?? null,
        recurrence_by_monthday ?? null,
        recurrence_start_date ?? null,
        recurrence_end_date ?? null,
        recurrence_anchor_date ?? null,
        reminder?.enabled ?? false,
        reminder?.enabled ? Number(reminder.before_minutes) : null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
     console.error("Create task error:", error);

  return res.status(500).json({
    error: "Failed to create task",
    detail: error.message,
    code: error.code,
  });
  }
});

// get tasks
TasksRoutes.get("/:user_id", async (req, res) => {
  try {
    const {user_id} = req.params; // from auth middleware

;

    const result = await pool.query(
      `
      SELECT 
        id, 
        user_id,
        category_id,
        title,
        description,
        difficulty,
        importance,
        type,
        due_at,
        time_of_day,
        recurrence_frequency,
        recurrence_interval,
        recurrence_by_weekday,
        recurrence_by_monthday,
        recurrence_start_date,
        recurrence_end_date,
        recurrence_anchor_date,
        reminder_enabled,
        reminder_before_minutes
       FROM tasks WHERE user_id=$1
      `,
      [
        user_id,]
    );

     

    return res.json(result.rows);
  } catch (error) {
     console.error("Create task error:", error);

  return res.status(500).json({
    error: "Failed to create task",
    detail: error.message,
    code: error.code,
  });
  }
});



TasksRoutes.post("/update/:id", async (req, res) => {
  try {
    const {id} = req.params; // from auth middleware

    const {
      title,
      description,
      difficulty,
      importance,
      category_id,

      type,
      due_at,
      time_of_day,

      recurrence_frequency,
      recurrence_interval,
      recurrence_by_weekday,
      recurrence_by_monthday,
      recurrence_start_date,
      recurrence_end_date,
      recurrence_anchor_date,

      reminder
    } = req.body;

    // const local_due_at = new Date(due_at).toLocaleString("en-US", {
    //   timeZone: timeZone,
    // });

    const result = await pool.query(
      `
      UPDATE  tasks SET 
        
        
        title=$1,
        description=$2,
        difficulty=$3,
        importance=$4,
        type=$5,
        due_at=$6,
        time_of_day=$7,
        recurrence_frequency=$8,
        recurrence_interval=$9,
        recurrence_by_weekday=$10,
        recurrence_by_monthday=$11,
        recurrence_start_date=$12,
        recurrence_end_date=$18,
        recurrence_anchor_date=$13,
        reminder_enabled=$14,
        reminder_before_minutes=$15::int , 
        category_id=$16

        WHERE id=$17
      

      RETURNING *
      `,
      [

        title,
        description,
        difficulty,
        importance,
        type,
        due_at ?? null,
        time_of_day ?? null,
        recurrence_frequency ?? null,
        recurrence_interval ?? 0,
        recurrence_by_weekday ?? null,
        recurrence_by_monthday ?? null,
        recurrence_start_date ?? null,
        recurrence_anchor_date ?? null,
        reminder?.enabled ?? false,
        reminder?.enabled ? Number(reminder.before_minutes) : null,
        category_id,
        id,
        recurrence_end_date ?? null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
     console.error("Update task error:", error);

  return res.status(500).json({
    error: "Failed to update task",
    detail: error.message,
    code: error.code,
  });
  }
});



TasksRoutes.post("/delete/:id", async (req, res) => {
  try {
    const {id} = req.params; // from auth middleware



    const result = await pool.query(
      `
      DELETE FROM   tasks  
        WHERE id=$1
      RETURNING * `,
      [
        id
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
     console.error("Delete task error:", error);

  return res.status(500).json({
    error: "Failed to delete task",
    detail: error.message,
    code: error.code,
  });
  }
});



// const TasksRoutes = express.TasksRoutes();

/**
 * Helpers
 */
function parseISODateOrNull(value) {
  if (!value) return null;
  // Accept "YYYY-MM-DD"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? null : value;
}

/**
 * POST /:task_id/complete
 * body: { date?: "YYYY-MM-DD" }
 * - Marks completion for that date (default: today)
 * - Uses UPSERT so repeated clicks won’t create duplicates
 */
TasksRoutes.post("/:task_id/complete", requireAuth, async (req, res) => {
  try {
    const { task_id } = req.params;

    // if you store user on req.user from auth middleware:
    const user_id = req.user?.userId;

    const date = parseISODateOrNull(req.body?.date) || null;

    // Ensure task belongs to user (VERY important)
    const taskCheck = await pool.query(
      `SELECT id FROM tasks WHERE id=$1 AND user_id=$2 `,
      [task_id,user_id]
    );

    if (taskCheck.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Task not found" });
    }

    // If no date provided, use CURRENT_DATE in SQL
    const result = await pool.query(
      `
      INSERT INTO task_completions (task_id, completed_on)
      VALUES ($1, $2)
      ON CONFLICT (task_id, completed_on)
      DO UPDATE SET completed_at = NOW()
      RETURNING *
      `,
      [task_id, date]
    );

    return res.json({ ok: true, completion: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * DELETE /:task_id/complete
 * body: { date?: "YYYY-MM-DD" }
 * - Removes completion record for that date (default: today)
 */
TasksRoutes.delete("/:task_id/complete", requireAuth, async (req, res) => {
  try {
    const { task_id } = req.params;
    const user_id = req.user?.userId;

    const date = parseISODateOrNull(req.body?.date) || null;

    // Ensure task belongs to user
    const taskCheck = await pool.query(
      `SELECT id FROM tasks WHERE id=$1 AND user_id=$2`,
      [task_id, user_id]
    );

    if (taskCheck.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Task not found" });
    }

    const result = await pool.query(
      `
      DELETE FROM task_completions
      WHERE task_id = $1
        AND completed_on = COALESCE($2::date, CURRENT_DATE)
      RETURNING *
      `,
      [task_id, date]
    );

    return res.json({ ok: true, removed: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * GET /:task_id/is-complete?date=YYYY-MM-DD
 * - Checks if completed for the given date (default: today)
 */
TasksRoutes.get("/:task_id/is-complete", requireAuth, async (req, res) => {
  try {
    const { task_id } = req.params;
    const userId = req.user?.id;

    const date = parseISODateOrNull(req.query?.date) || null;

    // Ensure task belongs to user
    const taskCheck = await pool.query(
      `SELECT id FROM tasks WHERE id=$1 AND user_id=$2`,
      [task_id, userId]
    );

    if (taskCheck.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Task not found" });
    }

    const result = await pool.query(
      `
      SELECT 1
      FROM task_completions
      WHERE task_id = $1
        AND completed_on = COALESCE($2::date, CURRENT_DATE)
      LIMIT 1
      `,
      [task_id, date]
    );

    return res.json({ ok: true, isComplete: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/**
 * GET /:task_id/completions?from=YYYY-MM-DD&to=YYYY-MM-DD
 * - Lists completion dates in a range (useful for calendar UI)
 */
TasksRoutes.get("/:task_id/completions", requireAuth, async (req, res) => {
  try {
    const { task_id } = req.params;
    const user_id = req.user?.userId;

    const taskCheck = await pool.query(
      `SELECT id FROM tasks WHERE id=$1 AND user_id=$2`,
      [task_id, user_id]
    );
    if (taskCheck.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Task not found" });
    }

    const result = await pool.query(
      `
      SELECT completed_on::text AS completed_on, completed_at
      FROM task_completions
      WHERE task_id = $1
      ORDER BY completed_on ASC
      `,
      [task_id]
    );

    return res.json({ ok: true, completions: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});






export default TasksRoutes;
