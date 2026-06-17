const router = require('express').Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  const [t, p, ip, d] = await Promise.all([
    db.execute('SELECT COUNT(*) as c FROM tasks'),
    db.execute("SELECT COUNT(*) as c FROM tasks WHERE status='pending'"),
    db.execute("SELECT COUNT(*) as c FROM tasks WHERE status='in_progress'"),
    db.execute("SELECT COUNT(*) as c FROM tasks WHERE status='done'"),
  ]);
  res.json({ total: Number(t.rows[0].c), pending: Number(p.rows[0].c), in_progress: Number(ip.rows[0].c), done: Number(d.rows[0].c) });
});

router.get('/', async (req, res) => {
  const { status, project_id } = req.query;
  const conditions = [];
  const args = [];
  if (status) { conditions.push('t.status = ?'); args.push(status); }
  if (project_id) { conditions.push('t.project_id = ?'); args.push(project_id); }
  if (req.user.role === 'field' && !project_id) { conditions.push('t.assigned_to = ?'); args.push(req.user.id); }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const { rows } = await db.execute({
    sql: `SELECT t.*, u1.name as assigned_name, u2.name as creator_name
          FROM tasks t
          LEFT JOIN users u1 ON t.assigned_to = u1.id
          LEFT JOIN users u2 ON t.created_by = u2.id${where}
          ORDER BY t.created_at DESC`,
    args
  });
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT t.*, u1.name as assigned_name, u2.name as creator_name, p.name as project_name
          FROM tasks t
          LEFT JOIN users u1 ON t.assigned_to = u1.id
          LEFT JOIN users u2 ON t.created_by = u2.id
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE t.id = ?`,
    args: [req.params.id]
  });
  if (!rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { title, description, objective, assigned_to, priority, location, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Título obrigatório' });
  const result = await db.execute({
    sql: 'INSERT INTO tasks (title, description, objective, assigned_to, created_by, priority, location, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [title, description, objective || null, assigned_to || null, req.user.id, priority || 'medium', location, due_date]
  });
  res.json({ id: Number(result.lastInsertRowid), title, description, objective, status: 'pending', priority: priority || 'medium' });
});

router.patch('/:id', async (req, res) => {
  const { title, description, objective, priority, location, due_date, assigned_to } = req.body;
  const fields = [];
  const args = [];
  if (title !== undefined) { fields.push('title=?'); args.push(title); }
  if (description !== undefined) { fields.push('description=?'); args.push(description); }
  if (objective !== undefined) { fields.push('objective=?'); args.push(objective); }
  if (priority !== undefined) { fields.push('priority=?'); args.push(priority); }
  if (location !== undefined) { fields.push('location=?'); args.push(location); }
  if (due_date !== undefined) { fields.push('due_date=?'); args.push(due_date); }
  if (assigned_to !== undefined) { fields.push('assigned_to=?'); args.push(assigned_to || null); }
  if (!fields.length) return res.status(400).json({ error: 'Nada para atualizar' });
  fields.push("updated_at=datetime('now')");
  args.push(req.params.id);
  await db.execute({ sql: `UPDATE tasks SET ${fields.join(', ')} WHERE id=?`, args });
  res.json({ success: true });
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'in_progress', 'done'].includes(status)) return res.status(400).json({ error: 'Status inválido' });
  await db.execute({ sql: "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?", args: [status, req.params.id] });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

module.exports = router;
