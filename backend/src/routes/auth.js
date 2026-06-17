const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { SECRET } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { name, email, password, role, lead_id, department_ids } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password, role, lead_id) VALUES (?, ?, ?, ?, ?)',
      args: [name, email, hash, role || 'field', lead_id || null]
    });
    const id = Number(result.lastInsertRowid);
    if (Array.isArray(department_ids)) {
      for (const depId of department_ids) {
        await db.execute({ sql: 'INSERT INTO user_departments (user_id, department_id) VALUES (?,?)', args: [id, depId] });
      }
    }
    const token = jwt.sign({ id, email, role: role || 'field', name }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, email, role: role || 'field' } });
  } catch {
    res.status(409).json({ error: 'Email já cadastrado' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
