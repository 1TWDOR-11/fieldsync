const router = require('express').Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function requireCoordinator(req, res, next) {
  if (req.user.role !== 'coordinator') return res.status(403).json({ error: 'Apenas coordenadores' });
  next();
}
router.use(requireCoordinator);

router.get('/overview', async (req, res) => {
  const counts = await Promise.all([
    db.execute('SELECT COUNT(*) as c FROM users'),
    db.execute('SELECT COUNT(*) as c FROM tasks'),
    db.execute('SELECT COUNT(*) as c FROM projects'),
    db.execute('SELECT COUNT(*) as c FROM clients'),
    db.execute('SELECT COUNT(*) as c FROM departments'),
    db.execute('SELECT COUNT(*) as c FROM occurrences'),
    db.execute("SELECT COUNT(*) as c FROM occurrences WHERE status='open'"),
  ]);
  const [users, tasks, projects, clients, departments, occurrences, openOccurrences] = counts.map(r => Number(r.rows[0].c));
  res.json({ users, tasks, projects, clients, departments, occurrences, openOccurrences });
});

router.get('/activity', async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const [users, tasks, occurrences, clients] = await Promise.all([
    db.execute({ sql: 'SELECT id, name, created_at FROM users ORDER BY created_at DESC LIMIT ?', args: [limit] }),
    db.execute({ sql: 'SELECT id, title, created_at FROM tasks ORDER BY created_at DESC LIMIT ?', args: [limit] }),
    db.execute({
      sql: `SELECT o.id, o.description, o.created_at, u.name as user_name
            FROM occurrences o LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC LIMIT ?`,
      args: [limit]
    }),
    db.execute({ sql: 'SELECT id, name, created_at FROM clients ORDER BY created_at DESC LIMIT ?', args: [limit] }),
  ]);

  const events = [
    ...users.rows.map(u => ({ type: 'user', label: `Novo usuário: ${u.name}`, created_at: u.created_at })),
    ...tasks.rows.map(t => ({ type: 'task', label: `Nova tarefa: ${t.title}`, created_at: t.created_at })),
    ...occurrences.rows.map(o => ({ type: 'occurrence', label: `Ocorrência registrada por ${o.user_name || 'alguém'}`, created_at: o.created_at })),
    ...clients.rows.map(c => ({ type: 'client', label: `Novo cliente: ${c.name}`, created_at: c.created_at })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);

  res.json(events);
});

module.exports = router;
