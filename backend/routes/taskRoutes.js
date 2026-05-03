const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Todo') AS todo,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Done') AS done
       FROM tasks
       WHERE assigned_to = $1`,
      [userId]
    );

    const overdueResult = await pool.query(
      `SELECT t.id, t.title, t.status, t.due_date, p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.due_date < CURRENT_DATE
         AND t.status != 'Done'
         AND t.assigned_to = $1
       ORDER BY t.due_date ASC`,
      [userId]
    );

    const recentResult = await pool.query(
      `SELECT t.id, t.title, t.status, t.due_date, p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [userId]
    );

    const stats = statsResult.rows[0];

    res.json({
      total: parseInt(stats.total),
      todo: parseInt(stats.todo),
      inProgress: parseInt(stats.in_progress),
      done: parseInt(stats.done),
      overdue: overdueResult.rows,
      recentTasks: recentResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { project_id, title, description, assigned_to, due_date } = req.body;

  if (!project_id || !title || !title.trim()) {
    return res.status(400).json({ error: 'project_id and title are required.' });
  }

  try {
    const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (assigned_to) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [assigned_to]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Assigned user not found.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        project_id,
        title.trim(),
        description?.trim() || null,
        assigned_to || null,
        due_date || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Todo', 'In Progress', 'Done'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be Todo, In Progress, or Done.' });
  }

  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = taskResult.rows[0];

    if (req.user.role !== 'admin' && task.assigned_to !== parseInt(req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

module.exports = router;