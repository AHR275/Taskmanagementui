import express from "express";
import pool from "../databases/db.js";
import { fromBody, toTask } from "../models/tasks.model.js";


const TasksRouter = express.Router();
// create a new task 

TasksRouter.post("", async (req, res) => {
    try {
        
        const t = fromBody(req.body);
        
        const result = await pool.query(
            `INSERT INTO tasks
            (title, description, difficulty, importance, category, schedule_type, due_time, recurrence, reminder, completed, completed_dates)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [
                t.title, t.description, t.difficulty, t.importance, t.category,
                t.schedule_type, t.due_time, t.recurrence, t.reminder, t.completed, t.completed_dates
            ]
        );
        
            return res.status(201).json(toTask(result.rows[0]));
        } catch (error) {
            console.error(error.message)
            
        }
});

// get all tasks 
TasksRouter.get("", async (req, res) => {

    try {
        
        const result = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
        return res.json(result.rows.map(toTask));
    } catch (err) {
        console.error(err.message);
    }
});


// update a task 
TasksRouter.put("/:id", async (req, res) => {
    try {
    
        const { id } = req.params;
        const t = fromBody(req.body);  
        const result = await pool.query(
                `UPDATE tasks
                SET title=$1, description=$2, difficulty=$3, importance=$4, category=$5,
                    schedule_type=$6, due_time=$7, recurrence=$8, reminder=$9, completed=$10, completed_dates=$11
                WHERE id=$12
                RETURNING *`,
                [
                t.title, t.description, t.difficulty, t.importance, t.category,
                t.schedule_type, t.due_time, t.recurrence, t.reminder, t.completed, t.completed_dates,
                id
                ]
            );

        res.json(toTask(result.rows[0]));
    } catch (err) {
        console.error(err.message);
    }


    
});


// delete  a task  
TasksRouter.delete("/:id",async(req,res)=>{
    try {
        const {id} = req.params; 
        const result = await pool.query("DELETE FROM tasks WHERE id=$1",[id]);
        return res.json(result.rows.map(toTask));
    } catch (err) {
        console.error(err.message);
    }
});

export default TasksRouter ; 



