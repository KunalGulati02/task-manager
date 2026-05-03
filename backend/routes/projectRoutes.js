const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT p.*, u.name AS creator_name,
                COUNT(DISTINCT pm.user_id) AS member_count,
                COUNT(DISTINCT t.id) AS task_count
         FROM projects p
         LEFT JOIN users u ON p.created_by = u.id
         LEFT JOIN project_members pm ON p.id = pm.project_id
         LEFT JOIN tasks t ON p.id = t.project_id
         GROUP BY p.id, u.name
         ORDER BY p.created_at DESC`
      );
    } else {
      result = await pool.query(
        `SELECT p.*, u.name AS creator_name,
                COUNT(DISTINCT pm2.user_id) AS member_count,
                COUNT(DISTINCT t.id) AS task_count
         FROM projects p
         LEFT JOIN users u ON p.created_by = u.id
         JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
         LEFT JOIN project_members pm2 ON p.id = pm2.project_id
         LEFT JOIN tasks t ON p.id = t.project_id
         GROUP BY p.id, u.name
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), description?.trim() || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const projectResult = await pool.query(
      `SELECT p.*, u.name AS creator_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projectResult.rows[0];

    if (req.user.role !== 'admin') {
      const memberCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this project.' });
      }
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM users u
       JOIN project_members pm ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.name ASC`,
      [id]
    );

    const tasksResult = await pool.query(
      `SELECT t.*, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [id]
    );

    res.json({
      ...project,
      members: membersResult.rows,
      tasks: tasksResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.post('/:id/members', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  try {
    const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, user_id]
    );

    res.json({ message: 'Member added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

router.delete('/:id/members/:userId', verifyToken, isAdmin, async (req, res) => {
  const { id, userId } = req.params;

  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ message: 'Member removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed.' });
  }
});

module.exports = router;