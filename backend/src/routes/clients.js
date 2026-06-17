const router = require('express').Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await db.execute(`
    SELECT c.*, u.name as responsible_name,
      COUNT(DISTINCT p.id) as project_count
    FROM clients c
    LEFT JOIN users u ON u.id = c.responsible_id
    LEFT JOIN projects p ON p.client_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC
  `);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT c.*, u.name as responsible_name
          FROM clients c LEFT JOIN users u ON u.id = c.responsible_id
          WHERE c.id = ?`,
    args: [req.params.id]
  });
  if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' });
  res.json(rows[0]);
});

router.get('/:id/projects', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT p.*,
            COUNT(DISTINCT t.id) as task_count,
            COUNT(DISTINCT CASE WHEN t.status='done' THEN t.id END) as done_count
          FROM projects p
          LEFT JOIN tasks t ON t.project_id = p.id
          WHERE p.client_id = ?
          GROUP BY p.id ORDER BY p.created_at DESC`,
    args: [req.params.id]
  });
  res.json(rows);
});

router.post('/', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, contact_name, contact_email, segment, status, needs, service, responsible_id, attachments } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const r = await db.execute({
    sql: 'INSERT INTO clients (name, contact_name, contact_email, segment, status, needs, service, responsible_id, attachments) VALUES (?,?,?,?,?,?,?,?,?)',
    args: [name, contact_name, contact_email, segment || 'Outros', status || 'prospect', needs || null, service || null, responsible_id || null, attachments || null]
  });
  res.json({ id: Number(r.lastInsertRowid), name, status: status || 'prospect' });
});

router.patch('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, contact_name, contact_email, segment, status, needs, service, responsible_id, attachments } = req.body;
  await db.execute({
    sql: 'UPDATE clients SET name=?, contact_name=?, contact_email=?, segment=?, status=?, needs=?, service=?, responsible_id=?, attachments=? WHERE id=?',
    args: [name, contact_name, contact_email, segment, status, needs || null, service || null, responsible_id || null, attachments || null, req.params.id]
  });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  await db.execute({ sql: 'DELETE FROM clients WHERE id=?', args: [req.params.id] });
  res.json({ success: true });
});

module.exports = router;
