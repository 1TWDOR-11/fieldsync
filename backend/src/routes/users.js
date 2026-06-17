const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await db.execute(`
    SELECT u.id, u.name, u.email, u.role, u.lead_id, u.created_at, l.name as lead_name
    FROM users u
    LEFT JOIN users l ON l.id = u.lead_id
    ORDER BY u.created_at DESC
  `);
  const { rows: deptRows } = await db.execute(`
    SELECT ud.user_id, d.id as department_id, d.name as department_name, d.color as department_color
    FROM user_departments ud JOIN departments d ON d.id = ud.department_id
  `);
  const byUser = {};
  for (const d of deptRows) {
    (byUser[d.user_id] ||= []).push({ id: d.department_id, name: d.department_name, color: d.department_color });
  }
  res.json(rows.map(u => ({ ...u, departments: byUser[u.id] || [] })));
});

router.get('/me', async (req, res) => {
  const { rows } = await db.execute({
    sql: `SELECT u.id, u.name, u.email, u.role, u.lead_id, u.created_at, l.name as lead_name
          FROM users u LEFT JOIN users l ON l.id = u.lead_id
          WHERE u.id = ?`,
    args: [req.user.id]
  });
  if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { rows: deptRows } = await db.execute({
    sql: `SELECT d.id, d.name, d.color FROM user_departments ud JOIN departments d ON d.id = ud.department_id WHERE ud.user_id = ?`,
    args: [req.user.id]
  });
  res.json({ ...rows[0], departments: deptRows });
});

router.patch('/me', async (req, res) => {
  const { name, password, current_password } = req.body;
  const updates = [];
  const args = [];
  if (name) { updates.push('name = ?'); args.push(name); }
  if (password) {
    if (!current_password) return res.status(400).json({ error: 'Informe a senha atual' });
    const { rows } = await db.execute({ sql: 'SELECT password FROM users WHERE id = ?', args: [req.user.id] });
    if (!rows.length || !bcrypt.compareSync(current_password, rows[0].password)) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    updates.push('password = ?'); args.push(bcrypt.hashSync(password, 10));
  }
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo enviado' });
  args.push(req.user.id);
  await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });
  res.json({ success: true });
});

router.patch('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  const { name, role, password, lead_id, department_ids } = req.body;
  const updates = [];
  const args = [];
  if (name)  { updates.push('name = ?');  args.push(name); }
  if (role)  { updates.push('role = ?');  args.push(role); }
  if (password) { updates.push('password = ?'); args.push(bcrypt.hashSync(password, 10)); }
  if (lead_id !== undefined) { updates.push('lead_id = ?'); args.push(lead_id || null); }
  if (updates.length) {
    args.push(req.params.id);
    await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });
  }
  if (Array.isArray(department_ids)) {
    await db.execute({ sql: 'DELETE FROM user_departments WHERE user_id = ?', args: [req.params.id] });
    for (const depId of department_ids) {
      await db.execute({ sql: 'INSERT INTO user_departments (user_id, department_id) VALUES (?,?)', args: [req.params.id, depId] });
    }
  }
  if (!updates.length && !Array.isArray(department_ids)) return res.status(400).json({ error: 'Nenhum campo enviado' });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
  await db.execute({ sql: 'DELETE FROM user_departments WHERE user_id = ?', args: [req.params.id] });
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

module.exports = router;
