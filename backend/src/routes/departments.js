const router = require('express').Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await db.execute(`
    SELECT d.*, u.name as lead_name
    FROM departments d
    LEFT JOIN users u ON u.id = d.lead_id
    ORDER BY d.created_at ASC
  `);
  res.json(rows);
});

router.post('/', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, description, color, lead_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const r = await db.execute({
    sql: 'INSERT INTO departments (name, description, color, lead_id) VALUES (?,?,?,?)',
    args: [name, description || null, color || '#1A6FFF', lead_id || null]
  });
  res.json({ id: Number(r.lastInsertRowid), name });
});

router.patch('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, description, color, lead_id } = req.body;
  await db.execute({
    sql: 'UPDATE departments SET name=?, description=?, color=?, lead_id=? WHERE id=?',
    args: [name, description || null, color, lead_id || null, req.params.id]
  });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  await db.execute({ sql: 'DELETE FROM departments WHERE id=?', args: [req.params.id] });
  res.json({ success: true });
});

module.exports = router;
