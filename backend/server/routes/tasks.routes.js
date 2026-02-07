import express from "express";
import pool from "../databases/db.js";
import { fromBody, toTask } from "../models/tasks.model.js";
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
      recurrence_anchor_date,

      reminder
    } = req.body;

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
        recurrence_anchor_date,
        reminder_enabled,
        reminder_before_minutes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17
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
TasksRoutes.post("/:user_id", async (req, res) => {
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
      recurrence_anchor_date,

      reminder
    } = req.body;

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
        id
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



export default TasksRoutes;
