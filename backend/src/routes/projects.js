const router = require('express').Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await db.execute(`
    SELECT p.*, c.name as client_name,
      COUNT(DISTINCT t.id) as task_count,
      COUNT(DISTINCT CASE WHEN t.status='done' THEN t.id END) as done_count
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC
  `);
  res.json(rows);
});

router.post('/', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, client_id, team, status, start_date, end_date, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const r = await db.execute({
    sql: 'INSERT INTO projects (name, client_id, team, status, start_date, end_date, description) VALUES (?,?,?,?,?,?,?)',
    args: [name, client_id || null, team || 'operational', status || 'planning', start_date, end_date, description]
  });
  res.json({ id: Number(r.lastInsertRowid), name });
});

router.patch('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, client_id, team, status, start_date, end_date, description, progress } = req.body;
  await db.execute({
    sql: 'UPDATE projects SET name=?, client_id=?, team=?, status=?, start_date=?, end_date=?, description=?, progress=? WHERE id=?',
    args: [name, client_id || null, team, status, start_date, end_date, description, progress ?? 0, req.params.id]
  });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  await db.execute({ sql: 'DELETE FROM projects WHERE id=?', args: [req.params.id] });
  res.json({ success: true });
});

module.exports = router;
