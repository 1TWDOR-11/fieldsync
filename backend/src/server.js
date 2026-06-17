const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDb } = require('./db');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'https://fieldsync-web-gamma.vercel.app',
  'https://fieldsync.vercel.app',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS não permitido'));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// wrap async route handlers so errors propagate to the error middleware
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
app.locals.asyncHandler = asyncHandler;

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/occurrences', require('./routes/occurrences'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// global error handler — prevents unhandled async errors from crashing the process
app.use((err, req, res, _next) => {
  console.error('[FieldSync Error]', err.message || err);
  if (err.message === 'CORS não permitido') return res.status(403).json({ error: err.message });
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

initDb().then(async () => {
  const { rows } = await db.execute('SELECT COUNT(*) as n FROM users');
  if (Number(rows[0].n) === 0) {
    console.log('Banco vazio — rodando seed inicial...');
    await seed(db);
    console.log('Seed concluído.');
  }
  app.listen(PORT, () => console.log(`FieldSync API rodando na porta ${PORT}`));
}).catch(err => { console.error('Falha ao inicializar DB:', err); process.exit(1); });
